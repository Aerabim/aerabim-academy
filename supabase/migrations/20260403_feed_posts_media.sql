-- Add media support to feed_posts
ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video')),
  ADD COLUMN IF NOT EXISTS media_url  TEXT;
