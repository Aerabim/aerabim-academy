-- Add expanded thumbnail for landscape card state
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS thumbnail_expanded_url TEXT;
