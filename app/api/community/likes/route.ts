import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasActiveCommunityAccess } from '@/lib/community/queries';
import type { ApiError, ToggleLikePayload, ToggleLikeResponse } from '@/types';

// ── POST: Toggle like (idempotent) ────────────────────

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

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Errore di configurazione server.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const body = (await req.json()) as ToggleLikePayload;

    // Validate: exactly one target
    const hasDiscussion = !!body.discussionId;
    const hasReply = !!body.replyId;

    if (hasDiscussion === hasReply) {
      return NextResponse.json(
        { error: 'Specifica discussionId o replyId (non entrambi).' } satisfies ApiError,
        { status: 400 },
      );
    }

    if (hasDiscussion) {
      // Toggle like on discussion
      const { data: existing } = await admin
        .from('community_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('discussion_id', body.discussionId!)
        .limit(1)
        .single();

      if (existing) {
        await admin
          .from('community_likes')
          .delete()
          .eq('id', (existing as { id: string }).id);
      } else {
        await admin
          .from('community_likes')
          .insert({
            user_id: user.id,
            discussion_id: body.discussionId!,
            reply_id: null,
          });
      }

      // Get updated count
      const { count } = await admin
        .from('community_likes')
        .select('id', { count: 'exact', head: true })
        .eq('discussion_id', body.discussionId!);

      return NextResponse.json({
        liked: !existing,
        count: count ?? 0,
      } satisfies ToggleLikeResponse);
    } else {
      // Toggle like on reply
      const { data: existing } = await admin
        .from('community_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('reply_id', body.replyId!)
        .limit(1)
        .single();

      if (existing) {
        await admin
          .from('community_likes')
          .delete()
          .eq('id', (existing as { id: string }).id);
      } else {
        await admin
          .from('community_likes')
          .insert({
            user_id: user.id,
            discussion_id: null,
            reply_id: body.replyId!,
          });
      }

      const { count } = await admin
        .from('community_likes')
        .select('id', { count: 'exact', head: true })
        .eq('reply_id', body.replyId!);

      return NextResponse.json({
        liked: !existing,
        count: count ?? 0,
      } satisfies ToggleLikeResponse);
    }
  } catch (err) {
    console.error('Like toggle error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
