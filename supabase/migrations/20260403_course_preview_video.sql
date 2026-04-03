-- Add preview video fields to courses
-- preview_playback_id: public Mux playback ID for the short clip
-- preview_asset_id:    Mux asset ID for cleanup on course deletion

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS preview_playback_id TEXT,
  ADD COLUMN IF NOT EXISTS preview_asset_id    TEXT;
