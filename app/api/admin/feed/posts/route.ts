import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

/** GET /api/admin/feed/posts — list all feed posts */
export async function GET() {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin, userId } = result;

    const { data, error } = await admin
      .from('feed_posts')
      .select('id, title, body, href, is_pinned, is_published, created_at, media_type, media_url, publish_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Errore nel caricamento.' } satisfies ApiError, { status: 500 });
    }

    const posts = ((data ?? []) as {
      id: string; title: string; body: string; href: string | null;
      is_pinned: boolean; is_published: boolean; created_at: string;
      media_type: string | null; media_url: string | null; publish_at: string | null;
    }[]).map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      href: p.href,
      isPinned: p.is_pinned,
      isPublished: p.is_published,
      createdAt: p.created_at,
      mediaType: p.media_type as 'image' | 'video' | null,
      mediaUrl: p.media_url,
      publishAt: p.publish_at,
    }));

    void userId; // used for auth only
    return NextResponse.json({ posts });
  } catch (err) {
    console.error('GET /api/admin/feed/posts error:', err);
    return NextResponse.json({ error: 'Errore interno.' } satisfies ApiError, { status: 500 });
  }
}

/** POST /api/admin/feed/posts — create a new feed post */
export async function POST(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin, userId } = result;

    const body = await req.json() as {
      title?: string;
      body?: string;
      href?: string;
      isPinned?: boolean;
      isPublished?: boolean;
      mediaType?: 'image' | 'video' | null;
      mediaUrl?: string | null;
      publishAt?: string | null;
    };

    if (!body.title?.trim() || !body.body?.trim()) {
      return NextResponse.json(
        { error: 'Titolo e testo sono obbligatori.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const { data, error } = await admin
      .from('feed_posts')
      .insert({
        author_id: userId,
        title: body.title.trim(),
        body: body.body.trim(),
        href: body.href?.trim() || null,
        is_pinned: body.isPinned ?? false,
        is_published: body.isPublished ?? false,
        media_type: body.mediaType ?? null,
        media_url: body.mediaUrl ?? null,
        publish_at: body.publishAt ?? null,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('POST feed_posts error:', error);
      return NextResponse.json({ error: 'Errore durante la creazione.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ id: (data as { id: string }).id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/feed/posts error:', err);
    return NextResponse.json({ error: 'Errore interno.' } satisfies ApiError, { status: 500 });
  }
}
