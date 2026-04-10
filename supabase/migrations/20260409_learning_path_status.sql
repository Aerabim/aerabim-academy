-- Migrazione: sostituisce `is_published` (boolean) con `status` (text)
-- e aggiunge `updated_at` con trigger automatico su learning_paths.
-- Aggiorna le RLS policy dipendenti da is_published.

-- 1. Aggiunge colonna status
ALTER TABLE learning_paths
  ADD COLUMN status text NOT NULL DEFAULT 'draft';

-- 2. Migra dati esistenti
UPDATE learning_paths
  SET status = CASE WHEN is_published THEN 'published' ELSE 'draft' END;

-- 3. Aggiunge updated_at
ALTER TABLE learning_paths
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

-- 4. Trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION set_learning_path_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER learning_paths_set_updated_at
  BEFORE UPDATE ON learning_paths
  FOR EACH ROW EXECUTE FUNCTION set_learning_path_updated_at();

-- 5. Ricrea le RLS policy usando status al posto di is_published
DROP POLICY IF EXISTS lp_read_published ON learning_paths;
DROP POLICY IF EXISTS lps_read_published ON learning_path_steps;

CREATE POLICY lp_read_published ON learning_paths
  FOR SELECT USING (status = 'published');

CREATE POLICY lps_read_published ON learning_path_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM learning_paths lp
      WHERE lp.id = learning_path_steps.path_id
        AND lp.status = 'published'
    )
  );

-- 6. Rimuove is_published (sostituito da status)
ALTER TABLE learning_paths DROP COLUMN is_published;
