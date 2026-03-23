import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

/** GET /api/admin/press — list all press mentions */
export async function GET() {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { data, error } = await admin
      .from('press_mentions')
      .select('id, title, source_name, source_url, source_logo, excerpt, is_published, published_at, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Errore nel recupero.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ pressMentions: data ?? [] });
  } catch (err) {
    console.error('GET press error:', err);
    return NextResponse.json({ error: 'Errore interno del server.' } satisfies ApiError, { status: 500 });
  }
}

/** POST /api/admin/press — create press mention */
export async function POST(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = await req.json();

    if (!body.title || !body.sourceName || !body.sourceUrl) {
      return NextResponse.json({ error: 'Campi obbligatori: title, sourceName, sourceUrl.' } satisfies ApiError, { status: 400 });
    }

    const { data, error } = await admin
      .from('press_mentions')
      .insert({
        title: body.title,
        source_name: body.sourceName,
        source_url: body.sourceUrl,
        source_logo: body.sourceLogo ?? null,
        excerpt: body.excerpt ?? null,
        is_published: body.isPublished ?? false,
        published_at: body.publishedAt ?? new Date().toISOString(),
      })
      .select('id, title')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Errore durante la creazione.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ pressMention: data }, { status: 201 });
  } catch (err) {
    console.error('POST press error:', err);
    return NextResponse.json({ error: 'Errore interno del server.' } satisfies ApiError, { status: 500 });
  }
}
