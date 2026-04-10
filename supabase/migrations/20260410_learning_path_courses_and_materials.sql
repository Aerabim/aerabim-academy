-- ══════════════════════════════════════════════════════════════════════════════
-- Fase 1: Semplificazione Learning Paths
-- Sostituisce learning_path_steps con due tabelle separate:
--   • learning_path_courses  — corsi ordinati del percorso
--   • learning_path_materials — materiali aggiuntivi del percorso
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Nuova join table: corsi del percorso ─────────────────────────────────

CREATE TABLE learning_path_courses (
  path_id    UUID    NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  course_id  UUID    NOT NULL REFERENCES courses(id)        ON DELETE CASCADE,
  order_num  INTEGER NOT NULL,
  PRIMARY KEY (path_id, course_id)
);

ALTER TABLE learning_path_courses ENABLE ROW LEVEL SECURITY;

-- Lettura pubblica solo per percorsi pubblicati
CREATE POLICY "lpc_select_published" ON learning_path_courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM learning_paths lp
      WHERE lp.id = path_id AND lp.status = 'published'
    )
  );

-- Service role: accesso pieno (gestione admin)
CREATE POLICY "lpc_service_all" ON learning_path_courses
  FOR ALL USING (auth.role() = 'service_role');

-- ─── 2. Migra passi di tipo 'course' esistenti ────────────────────────────────

INSERT INTO learning_path_courses (path_id, course_id, order_num)
SELECT path_id, course_id, order_num
FROM   learning_path_steps
WHERE  step_type = 'course'
  AND  course_id IS NOT NULL;

-- ─── 3. Nuova tabella: materiali del percorso ─────────────────────────────────

CREATE TABLE learning_path_materials (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id       UUID        NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  url           TEXT        NOT NULL,
  material_type TEXT        NOT NULL CHECK (material_type IN ('pdf', 'link')),
  order_num     INTEGER     NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE learning_path_materials ENABLE ROW LEVEL SECURITY;

-- Lettura pubblica solo per percorsi pubblicati
CREATE POLICY "lpm_select_published" ON learning_path_materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM learning_paths lp
      WHERE lp.id = path_id AND lp.status = 'published'
    )
  );

-- Service role: accesso pieno (gestione admin)
CREATE POLICY "lpm_service_all" ON learning_path_materials
  FOR ALL USING (auth.role() = 'service_role');

-- ─── 4. Progress: rimuove tracking step-by-step ───────────────────────────────
-- Il progresso ora si deriva dalle completion dei singoli corsi

ALTER TABLE learning_path_progress
  DROP COLUMN IF EXISTS completed_step_ids;

-- ─── 5. Elimina vecchia tabella ───────────────────────────────────────────────

DROP TABLE learning_path_steps;
