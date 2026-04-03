import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { ApiError } from '@/types';

export const dynamic = 'force-dynamic';

/** POST /api/admin/feed/posts/upload-image — upload an image for a feed post */
export async function POST(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File mancante.' } satisfies ApiError, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato non supportato. Usa JPG, PNG, WebP o GIF.' } satisfies ApiError,
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File troppo grande. Massimo 10 MB.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Database non configurato.' } satisfies ApiError, { status: 503 });
    }

    const ext = file.name.split('.').pop() ?? 'jpg';
    const fileName = `feed-media/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await admin.storage
      .from('lesson-materials')
      .upload(fileName, bytes, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error('Feed image upload error:', uploadError);
      return NextResponse.json({ error: 'Errore durante l\'upload.' } satisfies ApiError, { status: 500 });
    }

    const { data: urlData } = admin.storage.from('lesson-materials').getPublicUrl(fileName);

    return NextResponse.json({ url: urlData.publicUrl }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/feed/posts/upload-image error:', err);
    return NextResponse.json({ error: 'Errore interno.' } satisfies ApiError, { status: 500 });
  }
}
