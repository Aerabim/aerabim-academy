import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/** POST /api/admin/simulations/upload-thumbnail
 *  Body: multipart/form-data { file: File, simId: string }
 *  Returns: { thumbnailUrl: string }
 */
export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;
  const { admin } = auth;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const simId = (formData.get('simId') as string | null) ?? 'new';

    if (!file) {
      return NextResponse.json(
        { error: 'Nessun file selezionato.' } satisfies ApiError,
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Formato non supportato. Usa JPG, PNG, WebP o AVIF.' } satisfies ApiError,
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Immagine troppo grande. Dimensione massima: 5 MB.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
    const storagePath = `thumbnails-simulations/${simId}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from('lesson-materials')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Simulation thumbnail upload error:', uploadError);
      return NextResponse.json(
        { error: 'Errore durante il caricamento.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const { data: urlData } = admin.storage
      .from('lesson-materials')
      .getPublicUrl(storagePath);

    return NextResponse.json({ success: true, thumbnailUrl: urlData.publicUrl });
  } catch (err) {
    console.error('Upload simulation thumbnail error:', err);
    return NextResponse.json(
      { error: 'Errore durante il caricamento.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
