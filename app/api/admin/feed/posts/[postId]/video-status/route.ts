import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

export const dynamic = 'force-dynamic';

/** GET /api/admin/feed/posts/[postId]/video-status — poll for Mux video readiness */
export async function GET(_req: Request, { params }: { params: { postId: string } }) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { data, error } = await admin
      .from('feed_posts')
      .select('media_type, media_url')
      .eq('id', params.postId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Post non trovato.' } satisfies ApiError, { status: 404 });
    }

    const row = data as { media_type: string | null; media_url: string | null };
    return NextResponse.json({
      ready: row.media_type === 'video' && !!row.media_url,
      playbackId: row.media_url,
    });
  } catch (err) {
    console.error('GET /api/admin/feed/posts/[postId]/video-status error:', err);
    return NextResponse.json({ error: 'Errore interno.' } satisfies ApiError, { status: 500 });
  }
}
