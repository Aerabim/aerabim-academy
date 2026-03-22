import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasActiveCommunityAccess } from '@/lib/community/queries';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { discussionId: string; replyId: string };
}

// ── PATCH: Edit or soft-delete a reply ──────────────────

export async function PATCH(req: Request, { params }: RouteParams) {
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

    // Fetch reply
    const { data: rawReply } = await admin
      .from('community_replies')
      .select('id, author_id, discussion_id')
      .eq('id', params.replyId)
      .eq('discussion_id', params.discussionId)
      .eq('is_deleted', false)
      .single();

    if (!rawReply) {
      return NextResponse.json(
        { error: 'Risposta non trovata.' } satisfies ApiError,
        { status: 404 },
      );
    }

    const reply = rawReply as { id: string; author_id: string; discussion_id: string };
    const isAuthor = reply.author_id === user.id;

    // Check admin
    const { data: rawProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = (rawProfile as { role: string } | null)?.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Non hai i permessi per modificare questa risposta.' } satisfies ApiError,
        { status: 403 },
      );
    }

    const body = await req.json();
    const update: Record<string, string | boolean> = {
      updated_at: new Date().toISOString(),
    };

    if (isAuthor && typeof body.body === 'string') {
      update.body = body.body.trim();
    }

    if (isAdmin && typeof body.is_deleted === 'boolean') {
      update.is_deleted = body.is_deleted;
    }

    const { error: updateError } = await admin
      .from('community_replies')
      .update(update)
      .eq('id', params.replyId);

    if (updateError) {
      console.error('Update reply error:', updateError);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reply PATCH error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
