-- Add scheduled publishing support to feed_posts
ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS publish_at TIMESTAMPTZ;

-- Index for the cron query
CREATE INDEX IF NOT EXISTS idx_feed_posts_publish_at
  ON public.feed_posts (publish_at)
  WHERE is_published = false AND publish_at IS NOT NULL;
