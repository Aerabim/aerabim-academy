-- ============================================================
-- Favorites extended: support resources, learning paths, sessions
-- in addition to courses
-- Applied: 2026-04-05
-- ============================================================

-- Step 1: Make course_id nullable (one of 4 possible FK columns)
ALTER TABLE favorites ALTER COLUMN course_id DROP NOT NULL;

-- Step 2: Drop old unique constraint (was only on user_id + course_id)
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_user_id_course_id_key;

-- Step 3: Add new nullable FK columns
ALTER TABLE favorites
  ADD COLUMN IF NOT EXISTS resource_id uuid REFERENCES resources(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS path_id     uuid REFERENCES learning_paths(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS session_id  uuid REFERENCES live_sessions(id) ON DELETE CASCADE;

-- Step 4: Partial unique indexes — one per item type
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_course_unique
  ON favorites(user_id, course_id)   WHERE course_id   IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_resource_unique
  ON favorites(user_id, resource_id) WHERE resource_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_path_unique
  ON favorites(user_id, path_id)     WHERE path_id     IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_session_unique
  ON favorites(user_id, session_id)  WHERE session_id  IS NOT NULL;

-- Step 5: Check constraint — exactly one FK must be set per row
ALTER TABLE favorites
  ADD CONSTRAINT favorites_exactly_one_item CHECK (
    (CASE WHEN course_id   IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN resource_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN path_id     IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN session_id  IS NOT NULL THEN 1 ELSE 0 END) = 1
  );

-- Step 6: Additional indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_favorites_resource_id ON favorites(resource_id) WHERE resource_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_favorites_path_id     ON favorites(path_id)     WHERE path_id     IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_favorites_session_id  ON favorites(session_id)  WHERE session_id  IS NOT NULL;
