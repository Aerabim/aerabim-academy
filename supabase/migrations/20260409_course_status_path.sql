-- Aggiunge il valore 'path' all'enum course_status.
-- I corsi 'path' sono usati esclusivamente nei Learning Path
-- e non compaiono nel catalogo pubblico.
ALTER TYPE course_status ADD VALUE IF NOT EXISTS 'path';
