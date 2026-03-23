import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { pressId: string };
}

/** PATCH /api/admin/press/[pressId] — update press mention */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.sourceName !== undefined) updateData.source_name = body.sourceName;
    if (body.sourceUrl !== undefined) updateData.source_url = body.sourceUrl;
    if (body.sourceLogo !== undefined) updateData.source_logo = body.sourceLogo;
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt;
    if (body.isPublished !== undefined) updateData.is_published = body.isPublished;
    if (body.publishedAt !== undefined) updateData.published_at = body.publishedAt;

    const { error } = await admin.from('press_mentions').update(updateData).eq('id', params.pressId);
    if (error) {
      return NextResponse.json({ error: 'Errore durante l\'aggiornamento.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH press error:', err);
    return NextResponse.json({ error: 'Errore interno del server.' } satisfies ApiError, { status: 500 });
  }
}

/** DELETE /api/admin/press/[pressId] — delete press mention */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { error } = await admin.from('press_mentions').delete().eq('id', params.pressId);
    if (error) {
      return NextResponse.json({ error: 'Errore durante l\'eliminazione.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE press error:', err);
    return NextResponse.json({ error: 'Errore interno del server.' } satisfies ApiError, { status: 500 });
  }
}
