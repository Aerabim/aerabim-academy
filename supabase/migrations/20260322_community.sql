-- ============================================================
-- Community Feature — AerACADEMY
-- Tables: community_categories, community_discussions,
--         community_replies, community_likes
-- Also: add display_name to profiles, trigger for reply stats
-- ============================================================

-- ── 1. Add display_name to profiles ─────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- ── 2. community_categories (static reference) ─────────────

CREATE TABLE community_categories (
  id          TEXT PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  order_num   INTEGER NOT NULL DEFAULT 0,
  emoji       TEXT
);

ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read categories"
  ON community_categories FOR SELECT
  TO authenticated
  USING (true);

-- Seed categories
INSERT INTO community_categories (id, slug, name, description, order_num, emoji) VALUES
  ('generale', 'generale', 'Generale', 'Discussioni generali sulla community BIM/AEC', 0, '💬'),
  ('SW', 'software', 'Software BIM', 'Revit, Archicad, Tekla e altri software operativi', 1, '🏗️'),
  ('NL', 'normativa', 'Normativa & Legislazione', 'Normative BIM, CAM, codice appalti e legislazione', 2, '⚖️'),
  ('OB', 'openbim', 'openBIM & IFC', 'Standard IFC, BCF, interoperabilita e openBIM', 3, '📐'),
  ('PG', 'project-management', 'Project Management', 'Processi BIM, piani di gestione e governance', 4, '📋'),
  ('AI', 'ai-bim', 'AI nel BIM', 'Intelligenza artificiale e automazione nel settore AEC', 5, '🤖');

-- ── 3. community_discussions ────────────────────────────────

CREATE TABLE community_discussions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id   TEXT NOT NULL REFERENCES community_categories(id),
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  is_pinned     BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked     BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  reply_count   INTEGER NOT NULL DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_discussions_category ON community_discussions(category_id, is_deleted, created_at DESC);
CREATE INDEX idx_discussions_author ON community_discussions(author_id);
CREATE INDEX idx_discussions_activity ON community_discussions(is_deleted, last_reply_at DESC NULLS LAST);

ALTER TABLE community_discussions ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated users can read non-deleted discussions
CREATE POLICY "Authenticated users can read discussions"
  ON community_discussions FOR SELECT
  TO authenticated
  USING (is_deleted = FALSE);

-- INSERT: authenticated users can create discussions (author_id must match)
CREATE POLICY "Users can create own discussions"
  ON community_discussions FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- UPDATE: author can update own (title/body), admin can update any field
CREATE POLICY "Users can update own discussions"
  ON community_discussions FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ── 4. community_replies ────────────────────────────────────

CREATE TABLE community_replies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES community_discussions(id) ON DELETE CASCADE,
  author_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_replies_discussion ON community_replies(discussion_id, is_deleted, created_at ASC);
CREATE INDEX idx_replies_author ON community_replies(author_id);

ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read replies"
  ON community_replies FOR SELECT
  TO authenticated
  USING (is_deleted = FALSE);

CREATE POLICY "Users can create replies"
  ON community_replies FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own replies"
  ON community_replies FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ── 5. community_likes ─────────────────────────────────────

CREATE TABLE community_likes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discussion_id UUID REFERENCES community_discussions(id) ON DELETE CASCADE,
  reply_id      UUID REFERENCES community_replies(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT likes_one_target CHECK (
    (discussion_id IS NOT NULL AND reply_id IS NULL) OR
    (discussion_id IS NULL AND reply_id IS NOT NULL)
  ),
  CONSTRAINT likes_unique_discussion UNIQUE (user_id, discussion_id),
  CONSTRAINT likes_unique_reply UNIQUE (user_id, reply_id)
);

ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read likes"
  ON community_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON community_likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own likes"
  ON community_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── 6. Trigger: update reply_count and last_reply_at ────────

CREATE OR REPLACE FUNCTION update_discussion_reply_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_deleted = FALSE THEN
    UPDATE community_discussions
    SET reply_count = reply_count + 1,
        last_reply_at = NEW.created_at
    WHERE id = NEW.discussion_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
    UPDATE community_discussions
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = NEW.discussion_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.is_deleted = TRUE AND NEW.is_deleted = FALSE THEN
    UPDATE community_discussions
    SET reply_count = reply_count + 1
    WHERE id = NEW.discussion_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reply_stats
AFTER INSERT OR UPDATE OF is_deleted ON community_replies
FOR EACH ROW EXECUTE FUNCTION update_discussion_reply_stats();
