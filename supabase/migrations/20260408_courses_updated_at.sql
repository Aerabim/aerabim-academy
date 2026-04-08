-- Migration: add updated_at to courses with auto-update trigger
-- Backfills existing rows with created_at to preserve historical accuracy.

-- 1. Add column (nullable first, to allow backfill)
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- 2. Backfill existing rows with created_at
UPDATE courses
  SET updated_at = created_at
  WHERE updated_at IS NULL;

-- 3. Set NOT NULL + default
ALTER TABLE courses
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now();

-- 4. Shared trigger function (reusable for other tables)
CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 5. Trigger on courses
DROP TRIGGER IF EXISTS trg_courses_updated_at ON courses;
CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
