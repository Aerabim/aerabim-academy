import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { postId: string };
}

/** PATCH /api/admin/feed/posts/[postId] — update a feed post */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = await req.json() as {
      title?: string;
      body?: string;
      href?: string | null;
      isPinned?: boolean;
      isPublished?: boolean;
      mediaType?: 'image' | 'video' | null;
      mediaUrl?: string | null;
    };

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.body !== undefined) updateData.body = body.body.trim();
    if (body.href !== undefined) updateData.href = body.href?.trim() || null;
    if (body.isPinned !== undefined) updateData.is_pinned = body.isPinned;
    if (body.isPublished !== undefined) updateData.is_published = body.isPublished;
    if (body.mediaType !== undefined) updateData.media_type = body.mediaType;
    if (body.mediaUrl !== undefined) updateData.media_url = body.mediaUrl;

    const { error } = await admin
      .from('feed_posts')
      .update(updateData)
      .eq('id', params.postId);

    if (error) {
      console.error('PATCH feed_posts error:', error);
      return NextResponse.json({ error: 'Errore durante l\'aggiornamento.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/admin/feed/posts/[postId] error:', err);
    return NextResponse.json({ error: 'Errore interno.' } satisfies ApiError, { status: 500 });
  }
}

/** DELETE /api/admin/feed/posts/[postId] — delete a feed post */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { error } = await admin
      .from('feed_posts')
      .delete()
      .eq('id', params.postId);

    if (error) {
      console.error('DELETE feed_posts error:', error);
      return NextResponse.json({ error: 'Errore durante l\'eliminazione.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/feed/posts/[postId] error:', err);
    return NextResponse.json({ error: 'Errore interno.' } satisfies ApiError, { status: 500 });
  }
}
