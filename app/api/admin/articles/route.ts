import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

/** GET /api/admin/articles — list all articles (including unpublished) */
export async function GET() {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { data, error } = await admin
      .from('articles')
      .select('id, slug, title, excerpt, area, author_name, is_published, published_at, read_min, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Errore nel recupero degli articoli.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ articles: data ?? [] });
  } catch (err) {
    console.error('GET articles error:', err);
    return NextResponse.json({ error: 'Errore interno del server.' } satisfies ApiError, { status: 500 });
  }
}

/** POST /api/admin/articles — create article */
export async function POST(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = await req.json();

    if (!body.title || !body.slug) {
      return NextResponse.json({ error: 'Campi obbligatori: title, slug.' } satisfies ApiError, { status: 400 });
    }

    const { data, error } = await admin
      .from('articles')
      .insert({
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt ?? null,
        body: body.body ?? '',
        cover_url: body.coverUrl ?? null,
        area: body.area ?? null,
        author_name: body.authorName ?? '',
        author_role: body.authorRole ?? '',
        read_min: body.readMin ?? 5,
        related_course_id: body.relatedCourseId ?? null,
        is_published: body.isPublished ?? false,
        published_at: body.publishedAt ?? new Date().toISOString(),
      })
      .select('id, slug, title')
      .single();

    if (error || !data) {
      console.error('Insert article error:', error);
      return NextResponse.json({ error: 'Errore durante la creazione.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ article: data }, { status: 201 });
  } catch (err) {
    console.error('POST articles error:', err);
    return NextResponse.json({ error: 'Errore interno del server.' } satisfies ApiError, { status: 500 });
  }
}
