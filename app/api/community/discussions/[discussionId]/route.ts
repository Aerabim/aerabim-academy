import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasActiveCommunityAccess } from '@/lib/community/queries';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { discussionId: string };
}

// ── PATCH: Update a discussion ─────────────────────────

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

    const body = await req.json();

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Errore di configurazione server.' } satisfies ApiError,
        { status: 500 },
      );
    }

    // Fetch discussion to check ownership
    const { data: rawDiscussion } = await admin
      .from('community_discussions')
      .select('id, author_id, is_locked')
      .eq('id', params.discussionId)
      .eq('is_deleted', false)
      .single();

    if (!rawDiscussion) {
      return NextResponse.json(
        { error: 'Discussione non trovata.' } satisfies ApiError,
        { status: 404 },
      );
    }

    const discussion = rawDiscussion as { id: string; author_id: string; is_locked: boolean };
    const isAuthor = discussion.author_id === user.id;

    // Check if admin
    const { data: rawProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = (rawProfile as { role: string } | null)?.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Non hai i permessi per modificare questa discussione.' } satisfies ApiError,
        { status: 403 },
      );
    }

    // Build update object
    const update: Record<string, string | boolean | number | null> = {
      updated_at: new Date().toISOString(),
    };

    // Author can update title/body (if not locked)
    if (isAuthor && !discussion.is_locked) {
      if (typeof body.title === 'string') update.title = body.title.trim();
      if (typeof body.body === 'string') update.body = body.body.trim();
    }

    // Admin can update moderation fields
    if (isAdmin) {
      if (typeof body.is_pinned === 'boolean') update.is_pinned = body.is_pinned;
      if (typeof body.is_locked === 'boolean') update.is_locked = body.is_locked;
      if (typeof body.is_deleted === 'boolean') update.is_deleted = body.is_deleted;
      if (typeof body.title === 'string') update.title = body.title.trim();
      if (typeof body.body === 'string') update.body = body.body.trim();
    }

    const { error: updateError } = await admin
      .from('community_discussions')
      .update(update)
      .eq('id', params.discussionId);

    if (updateError) {
      console.error('Update discussion error:', updateError);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Discussion PATCH error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
