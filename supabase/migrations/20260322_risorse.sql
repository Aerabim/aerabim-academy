-- ============================================================
-- Risorse (Blog + Press) — AerACADEMY
-- Tables: articles, press_mentions
-- Articles: blog posts by AERABIM team, categorized by area
-- Press: external mentions, reviews, media coverage
-- ============================================================

-- ── 1. articles ─────────────────────────────────────────────

CREATE TABLE articles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  excerpt       TEXT,
  body          TEXT NOT NULL,
  cover_url     TEXT,
  area          TEXT,
  author_name   TEXT NOT NULL DEFAULT 'Team AERABIM',
  author_role   TEXT NOT NULL DEFAULT 'Formazione BIM',
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  published_at  TIMESTAMPTZ,
  read_min      INTEGER NOT NULL DEFAULT 5,
  related_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_articles_published ON articles(is_published, published_at DESC);
CREATE INDEX idx_articles_area ON articles(area, is_published);
CREATE INDEX idx_articles_slug ON articles(slug);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published articles"
  ON articles FOR SELECT
  TO authenticated
  USING (is_published = TRUE);

CREATE POLICY "Admins can manage articles"
  ON articles FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 2. press_mentions ───────────────────────────────────────

CREATE TABLE press_mentions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  source_name   TEXT NOT NULL,
  source_url    TEXT NOT NULL,
  source_logo   TEXT,
  excerpt       TEXT,
  published_at  TIMESTAMPTZ NOT NULL,
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_press_published ON press_mentions(is_published, published_at DESC);

ALTER TABLE press_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published press mentions"
  ON press_mentions FOR SELECT
  TO authenticated
  USING (is_published = TRUE);

CREATE POLICY "Admins can manage press mentions"
  ON press_mentions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
