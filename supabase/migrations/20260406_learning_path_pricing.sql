-- ============================================================
-- Learning Path Pricing + Enrollments + Simulation Path Link
-- AerACADEMY
-- Applied: 2026-04-06
-- ============================================================

-- ── 1. Colonne pricing su learning_paths ─────────────────────

ALTER TABLE public.learning_paths
  ADD COLUMN IF NOT EXISTS price_single     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_price_id  TEXT;

-- ── 2. Tabella learning_path_enrollments ─────────────────────

CREATE TABLE IF NOT EXISTS public.learning_path_enrollments (
  id                        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id                   UUID         NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  stripe_payment_intent_id  TEXT,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, path_id)
);

CREATE INDEX IF NOT EXISTS idx_lpe_user ON public.learning_path_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_lpe_path ON public.learning_path_enrollments(path_id);

ALTER TABLE public.learning_path_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lpe_select_own"
  ON public.learning_path_enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "lpe_service"
  ON public.learning_path_enrollments FOR ALL TO service_role
  USING (TRUE);

-- ── 3. FK path_id su simulations ─────────────────────────────

ALTER TABLE public.simulations
  ADD COLUMN IF NOT EXISTS path_id UUID REFERENCES public.learning_paths(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_simulations_path_id
  ON public.simulations(path_id) WHERE path_id IS NOT NULL;
