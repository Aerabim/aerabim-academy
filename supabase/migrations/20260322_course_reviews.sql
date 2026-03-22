-- ============================================================
-- Course Reviews — AerACADEMY
-- Table: course_reviews
-- Only enrolled users can leave one review per course.
-- Trigger keeps avg_rating + review_count on courses table.
-- ============================================================

-- ── 1. Add rating columns to courses ────────────────────────

ALTER TABLE courses ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(2,1) NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0;

-- ── 2. course_reviews ───────────────────────────────────────

CREATE TABLE course_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title       TEXT,
  body        TEXT,
  is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT reviews_unique_user_course UNIQUE (user_id, course_id)
);

CREATE INDEX idx_reviews_course ON course_reviews(course_id, is_deleted, created_at DESC);
CREATE INDEX idx_reviews_user ON course_reviews(user_id);

ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated users can read non-deleted reviews
CREATE POLICY "Authenticated users can read reviews"
  ON course_reviews FOR SELECT
  TO authenticated
  USING (is_deleted = FALSE);

-- INSERT: only users with an active enrollment can create a review
CREATE POLICY "Enrolled users can create reviews"
  ON course_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.user_id = auth.uid()
        AND enrollments.course_id = course_reviews.course_id
        AND (enrollments.expires_at IS NULL OR enrollments.expires_at > now())
    )
  );

-- UPDATE: author can update own review
CREATE POLICY "Users can update own reviews"
  ON course_reviews FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 3. Trigger: update avg_rating and review_count on courses

CREATE OR REPLACE FUNCTION update_course_review_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_course_id UUID;
BEGIN
  -- Determine which course to update
  IF TG_OP = 'DELETE' THEN
    target_course_id := OLD.course_id;
  ELSE
    target_course_id := NEW.course_id;
  END IF;

  UPDATE courses
  SET avg_rating = COALESCE(
        (SELECT ROUND(AVG(rating)::numeric, 1)
         FROM course_reviews
         WHERE course_id = target_course_id AND is_deleted = FALSE),
        0
      ),
      review_count = (
        SELECT COUNT(*)
        FROM course_reviews
        WHERE course_id = target_course_id AND is_deleted = FALSE
      )
  WHERE id = target_course_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_course_review_stats
AFTER INSERT OR UPDATE OF rating, is_deleted OR DELETE ON course_reviews
FOR EACH ROW EXECUTE FUNCTION update_course_review_stats();
