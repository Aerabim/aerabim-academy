-- ============================================================
-- Simulations — AerACADEMY
-- Table: simulations
-- 14 record fissi (7 figure × 2 tipi: scritto + pratico)
-- Applied: 2026-04-05
-- ============================================================

-- ── 1. Tabella ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.simulations (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT         UNIQUE NOT NULL,
  figura        TEXT         NOT NULL,
  tipo          TEXT         NOT NULL CHECK (tipo IN ('scritto', 'pratico')),
  descrizione   TEXT,
  domande       INTEGER,                         -- solo scritto → 30
  durata_min    INTEGER      NOT NULL DEFAULT 60,
  thumbnail_url TEXT,
  coming_soon   BOOLEAN      NOT NULL DEFAULT TRUE,
  order_num     INTEGER      NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_simulations_order ON public.simulations(order_num);

-- ── 2. RLS ───────────────────────────────────────────────────

ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

-- Lettura: tutti gli utenti autenticati (coming_soon gestito lato client)
CREATE POLICY "simulations_select"
  ON public.simulations FOR SELECT TO authenticated
  USING (TRUE);

-- Scrittura: solo service_role (admin)
CREATE POLICY "simulations_service"
  ON public.simulations FOR ALL TO service_role
  USING (TRUE);

-- ── 3. Seed 14 record ────────────────────────────────────────

INSERT INTO public.simulations (slug, figura, tipo, descrizione, domande, durata_min, coming_soon, order_num)
VALUES
  ('bim-specialist-arc-scritto',  'BIM Specialist ARC',  'scritto', 'Normativa, modellazione e coordinamento BIM in architettura',          30, 60, TRUE,  1),
  ('bim-specialist-arc-pratico',  'BIM Specialist ARC',  'pratico', 'Esercitazione pratica su modello Revit / ArchiCAD',                    NULL, 90, TRUE,  2),
  ('bim-specialist-mep-scritto',  'BIM Specialist MEP',  'scritto', 'Impianti meccanici, elettrici e idraulici in ambiente BIM',             30, 60, TRUE,  3),
  ('bim-specialist-mep-pratico',  'BIM Specialist MEP',  'pratico', 'Esercitazione pratica su modello MEP',                                 NULL, 90, TRUE,  4),
  ('bim-specialist-str-scritto',  'BIM Specialist STR',  'scritto', 'Strutture, analisi e modellazione BIM strutturale',                     30, 60, TRUE,  5),
  ('bim-specialist-str-pratico',  'BIM Specialist STR',  'pratico', 'Esercitazione pratica su modello strutturale',                         NULL, 90, TRUE,  6),
  ('bim-specialist-infr-scritto', 'BIM Specialist INFR', 'scritto', 'Infrastrutture, strade e reti in ambiente BIM',                         30, 60, TRUE,  7),
  ('bim-specialist-infr-pratico', 'BIM Specialist INFR', 'pratico', 'Esercitazione pratica su modello infrastrutturale',                    NULL, 90, TRUE,  8),
  ('bim-coordinator-scritto',     'BIM Coordinator',     'scritto', 'Coordinamento modelli, clash detection e ISO 19650',                    30, 60, TRUE,  9),
  ('bim-coordinator-pratico',     'BIM Coordinator',     'pratico', 'Esercitazione di clash detection e gestione IFC',                      NULL, 90, TRUE, 10),
  ('bim-manager-scritto',         'BIM Manager',         'scritto', 'Strategia BIM, contratti e gestione processi UNI 11337',                30, 60, TRUE, 11),
  ('bim-manager-pratico',         'BIM Manager',         'pratico', 'Esercitazione su piano di gestione BIM e BEP',                         NULL, 90, TRUE, 12),
  ('cde-manager-scritto',         'CDE Manager',         'scritto', 'Ambienti di condivisione dati, standard e workflow documentale',        30, 60, TRUE, 13),
  ('cde-manager-pratico',         'CDE Manager',         'pratico', 'Esercitazione pratica su piattaforma CDE',                             NULL, 90, TRUE, 14)
ON CONFLICT (slug) DO NOTHING;
