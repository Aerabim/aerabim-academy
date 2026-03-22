import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasActiveCommunityAccess } from '@/lib/community/queries';
import type { ApiError, CreateDiscussionPayload } from '@/types';

// ── POST: Create a new discussion ─────────────────────

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Devi effettuare il login.' } satisfies ApiError,
        { status: 401 },
      );
    }

    const isPro = await hasActiveCommunityAccess(supabase, user.id);
    if (!isPro) {
      return NextResponse.json(
        { error: 'La community è riservata agli abbonati Pro.' } satisfies ApiError,
        { status: 403 },
      );
    }

    const body = (await req.json()) as CreateDiscussionPayload;

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Inserisci un titolo per la discussione.' } satisfies ApiError,
        { status: 400 },
      );
    }

    if (!body.body?.trim()) {
      return NextResponse.json(
        { error: 'Inserisci il contenuto della discussione.' } satisfies ApiError,
        { status: 400 },
      );
    }

    if (!body.categoryId) {
      return NextResponse.json(
        { error: 'Seleziona una categoria.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Validate category exists
    const { data: category } = await supabase
      .from('community_categories')
      .select('id')
      .eq('id', body.categoryId)
      .single();

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria non valida.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Errore di configurazione server.' } satisfies ApiError,
        { status: 500 },
      );
    }

    // Insert discussion via admin client
    const { data: rawDiscussion, error: insertError } = await admin
      .from('community_discussions')
      .insert({
        author_id: user.id,
        category_id: body.categoryId,
        title: body.title.trim(),
        body: body.body.trim(),
      })
      .select('id, category_id')
      .single();

    if (insertError || !rawDiscussion) {
      console.error('Insert discussion error:', insertError);
      return NextResponse.json(
        { error: 'Errore durante la creazione della discussione.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const discussion = rawDiscussion as { id: string; category_id: string };

    // Get category slug for redirect
    const { data: rawCat } = await admin
      .from('community_categories')
      .select('slug')
      .eq('id', discussion.category_id)
      .single();

    const slug = (rawCat as { slug: string } | null)?.slug ?? 'generale';

    return NextResponse.json({
      success: true,
      discussionId: discussion.id,
      redirectUrl: `/community/${slug}/${discussion.id}`,
    });
  } catch (err) {
    console.error('Discussion POST error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
