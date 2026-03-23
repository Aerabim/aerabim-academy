-- Add material_url column to lessons for file-based lesson materials
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS material_url TEXT;

-- Create storage bucket for lesson materials (PDF, PPTX, XLSX, DOCX)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-materials', 'lesson-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read access for lesson materials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lesson-materials');

CREATE POLICY "Service role upload for lesson materials"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'lesson-materials');

CREATE POLICY "Service role update for lesson materials"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'lesson-materials');

CREATE POLICY "Service role delete for lesson materials"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'lesson-materials');
