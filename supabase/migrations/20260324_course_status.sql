-- Migration: Replace is_published boolean with status enum on courses table
-- Status values: draft, hidden, published, archived

-- 1. Create the enum type
CREATE TYPE course_status AS ENUM ('draft', 'hidden', 'published', 'archived');

-- 2. Add status column with default 'draft'
ALTER TABLE courses ADD COLUMN status course_status NOT NULL DEFAULT 'draft';

-- 3. Migrate existing data: is_published=true → 'published', false → 'draft'
UPDATE courses SET status = CASE WHEN is_published = true THEN 'published'::course_status ELSE 'draft'::course_status END;

-- 4. Drop dependent RLS policies BEFORE dropping the column
DROP POLICY IF EXISTS "Public can read published courses" ON courses;
DROP POLICY IF EXISTS "Public can view published courses" ON courses;
DROP POLICY IF EXISTS "Public can read modules" ON modules;
DROP POLICY IF EXISTS "Public can read preview lessons" ON lessons;

-- 5. Drop the old column
ALTER TABLE courses DROP COLUMN is_published;

-- 6. Create index for catalog queries (most queries filter by status)
CREATE INDEX idx_courses_status ON courses (status);

-- 7. Recreate RLS policies using the new status column
-- Courses: allow public read for 'published' and 'hidden'
CREATE POLICY "Public can read published courses" ON courses
  FOR SELECT USING (status IN ('published', 'hidden'));

-- Modules: allow public read if parent course is published or hidden
CREATE POLICY "Public can read modules" ON modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses WHERE courses.id = modules.course_id
      AND courses.status IN ('published', 'hidden')
    )
  );

-- Lessons: allow public read of preview lessons if parent course is published or hidden
CREATE POLICY "Public can read preview lessons" ON lessons
  FOR SELECT USING (
    is_preview = true
    AND EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id
      AND courses.status IN ('published', 'hidden')
    )
  );
