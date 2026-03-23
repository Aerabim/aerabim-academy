-- Migration: Expand user roles beyond student/admin
-- Adds: docente, tutor, moderatore roles

-- Drop existing constraint and add expanded one
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'admin', 'docente', 'tutor', 'moderatore'));
