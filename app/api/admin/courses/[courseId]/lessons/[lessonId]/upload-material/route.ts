import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(
  request: Request,
  { params }: { params: { courseId: string; lessonId: string } },
) {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;

  const { admin } = auth;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nessun file selezionato.' } satisfies ApiError, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Tipo file non supportato. Formati accettati: PDF, PPTX, XLSX, DOCX.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File troppo grande. Dimensione massima: 50 MB.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Verify lesson exists and belongs to course
    const { data: lesson } = await admin
      .from('lessons')
      .select('id, module_id')
      .eq('id', params.lessonId)
      .single();

    if (!lesson) {
      return NextResponse.json({ error: 'Lezione non trovata.' } satisfies ApiError, { status: 404 });
    }

    // Upload to Supabase Storage
    const ext = file.name.split('.').pop() ?? 'pdf';
    const storagePath = `${params.courseId}/${params.lessonId}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from('lesson-materials')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Errore durante il caricamento del file.' } satisfies ApiError, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = admin.storage
      .from('lesson-materials')
      .getPublicUrl(storagePath);

    const materialUrl = urlData.publicUrl;

    // Update lesson record
    const { error: updateError } = await admin
      .from('lessons')
      .update({ material_url: materialUrl })
      .eq('id', params.lessonId);

    if (updateError) {
      console.error('Update lesson error:', updateError);
      return NextResponse.json({ error: 'Errore nell\'aggiornamento della lezione.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ success: true, materialUrl });
  } catch (err) {
    console.error('Upload material error:', err);
    return NextResponse.json({ error: 'Errore durante il caricamento.' } satisfies ApiError, { status: 500 });
  }
}
