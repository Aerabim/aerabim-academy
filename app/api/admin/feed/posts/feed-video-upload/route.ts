import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import { createMuxFeedVideoUploadUrl } from '@/lib/mux/helpers';
import type { ApiError } from '@/types';

export const dynamic = 'force-dynamic';

/** POST /api/admin/feed/posts/feed-video-upload — create Mux Direct Upload URL for a feed post video */
export async function POST(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;

    const { postId } = await req.json() as { postId?: string };
    if (!postId) {
      return NextResponse.json({ error: 'postId mancante.' } satisfies ApiError, { status: 400 });
    }

    const { uploadUrl, uploadId } = await createMuxFeedVideoUploadUrl(postId);
    return NextResponse.json({ uploadUrl, uploadId }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/feed/posts/feed-video-upload error:', err);
    return NextResponse.json({ error: 'Errore interno.' } satisfies ApiError, { status: 500 });
  }
}
