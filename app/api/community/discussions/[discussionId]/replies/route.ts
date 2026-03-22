import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasActiveCommunityAccess } from '@/lib/community/queries';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { discussionId: string };
}

// ── POST: Create a reply ───────────────────────────────

export async function POST(req: Request, { params }: RouteParams) {
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

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Errore di configurazione server.' } satisfies ApiError,
        { status: 500 },
      );
    }

    // Check discussion exists and is not locked
    const { data: rawDiscussion } = await admin
      .from('community_discussions')
      .select('id, is_locked, is_deleted')
      .eq('id', params.discussionId)
      .single();

    if (!rawDiscussion) {
      return NextResponse.json(
        { error: 'Discussione non trovata.' } satisfies ApiError,
        { status: 404 },
      );
    }

    const discussion = rawDiscussion as { id: string; is_locked: boolean; is_deleted: boolean };

    if (discussion.is_deleted) {
      return NextResponse.json(
        { error: 'Discussione non trovata.' } satisfies ApiError,
        { status: 404 },
      );
    }

    if (discussion.is_locked) {
      return NextResponse.json(
        { error: 'Questa discussione è chiusa. Non è possibile aggiungere risposte.' } satisfies ApiError,
        { status: 403 },
      );
    }

    const body = await req.json();

    if (!body.body?.trim()) {
      return NextResponse.json(
        { error: 'Inserisci il contenuto della risposta.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const { data: rawReply, error: insertError } = await admin
      .from('community_replies')
      .insert({
        discussion_id: params.discussionId,
        author_id: user.id,
        body: body.body.trim(),
      })
      .select('id')
      .single();

    if (insertError || !rawReply) {
      console.error('Insert reply error:', insertError);
      return NextResponse.json(
        { error: 'Errore durante la creazione della risposta.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const reply = rawReply as { id: string };

    return NextResponse.json({
      success: true,
      replyId: reply.id,
    });
  } catch (err) {
    console.error('Reply POST error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
