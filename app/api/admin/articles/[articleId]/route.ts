import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { articleId: string };
}

/** PATCH /api/admin/articles/[articleId] — update article */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt;
    if (body.body !== undefined) updateData.body = body.body;
    if (body.coverUrl !== undefined) updateData.cover_url = body.coverUrl;
    if (body.area !== undefined) updateData.area = body.area;
    if (body.authorName !== undefined) updateData.author_name = body.authorName;
    if (body.authorRole !== undefined) updateData.author_role = body.authorRole;
    if (body.readMin !== undefined) updateData.read_min = body.readMin;
    if (body.relatedCourseId !== undefined) updateData.related_course_id = body.relatedCourseId;
    if (body.isPublished !== undefined) updateData.is_published = body.isPublished;
    if (body.publishedAt !== undefined) updateData.published_at = body.publishedAt;

    const { error } = await admin.from('articles').update(updateData).eq('id', params.articleId);

    if (error) {
      return NextResponse.json({ error: 'Errore durante l\'aggiornamento.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH article error:', err);
    return NextResponse.json({ error: 'Errore interno del server.' } satisfies ApiError, { status: 500 });
  }
}

/** DELETE /api/admin/articles/[articleId] — delete article */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { error } = await admin.from('articles').delete().eq('id', params.articleId);
    if (error) {
      return NextResponse.json({ error: 'Errore durante l\'eliminazione.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE article error:', err);
    return NextResponse.json({ error: 'Errore interno del server.' } satisfies ApiError, { status: 500 });
  }
}
