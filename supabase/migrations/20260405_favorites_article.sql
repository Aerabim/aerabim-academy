-- ============================================================
-- Favorites: add article_id for bookmarking articles
-- Applied: 2026-04-05
-- ============================================================

-- Step 1: Drop existing check constraint (will re-add with 5 options)
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_exactly_one_item;

-- Step 2: Add article_id FK column
ALTER TABLE favorites
  ADD COLUMN IF NOT EXISTS article_id uuid REFERENCES articles(id) ON DELETE CASCADE;

-- Step 3: Partial unique index for articles
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_article_unique
  ON favorites(user_id, article_id) WHERE article_id IS NOT NULL;

-- Step 4: Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_favorites_article_id
  ON favorites(article_id) WHERE article_id IS NOT NULL;

-- Step 5: Re-add check constraint with 5 possible item types (exactly one must be set)
ALTER TABLE favorites
  ADD CONSTRAINT favorites_exactly_one_item CHECK (
    (CASE WHEN course_id   IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN resource_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN path_id     IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN session_id  IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN article_id  IS NOT NULL THEN 1 ELSE 0 END) = 1
  );
