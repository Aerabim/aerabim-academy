-- ── Feed System ────────────────────────────────────────────────────────────

-- 1. Privacy preferences per utente su profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS feed_privacy JSONB NOT NULL DEFAULT '{
    "show_progress": true,
    "show_certificates": true,
    "show_enrollments": true,
    "show_online": true
  }';

-- 2. Post editoriali admin
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  href         TEXT,
  is_pinned    BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Configurazione globale sorgenti feed (singola riga, id = 1)
CREATE TABLE IF NOT EXISTS public.feed_config (
  id                      INT PRIMARY KEY DEFAULT 1,
  progress_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  certificates_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  enrollments_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  discussions_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserisce la riga di config se non esiste
INSERT INTO public.feed_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- 4. Item nascosti dalla moderazione admin
CREATE TABLE IF NOT EXISTS public.feed_hidden_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type   TEXT NOT NULL, -- 'progress' | 'certificate' | 'enrollment' | 'discussion'
  item_id     TEXT NOT NULL,
  hidden_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hidden_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (item_type, item_id)
);

-- ── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_hidden_items ENABLE ROW LEVEL SECURITY;

-- feed_posts: lettura pubblica (autenticati), scrittura solo service_role
CREATE POLICY "feed_posts_select" ON public.feed_posts
  FOR SELECT TO authenticated USING (is_published = TRUE);

CREATE POLICY "feed_posts_all_service" ON public.feed_posts
  FOR ALL TO service_role USING (TRUE);

-- feed_config: lettura pubblica (autenticati), scrittura solo service_role
CREATE POLICY "feed_config_select" ON public.feed_config
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "feed_config_all_service" ON public.feed_config
  FOR ALL TO service_role USING (TRUE);

-- feed_hidden_items: solo service_role
CREATE POLICY "feed_hidden_all_service" ON public.feed_hidden_items
  FOR ALL TO service_role USING (TRUE);
