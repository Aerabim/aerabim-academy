-- Migration: Add is_featured to courses for manual hero selection in catalog
-- Date: 2026-04-02

-- 1. Add the column (default false = no course featured initially)
ALTER TABLE public.courses ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Partial unique index: allows is_featured=FALSE on many rows,
--    but is_featured=TRUE on at most ONE row at a time.
CREATE UNIQUE INDEX idx_courses_single_featured
  ON public.courses (is_featured)
  WHERE (is_featured = TRUE);
