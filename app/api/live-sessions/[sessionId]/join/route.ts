import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasActiveProSubscription } from '@/lib/live/queries';
import { generatePlaybackTokens } from '@/lib/mux/helpers';
import type { JoinSessionResponse, ApiError } from '@/types';

interface RouteParams {
  params: { sessionId: string };
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Devi effettuare il login.' } satisfies ApiError,
        { status: 401 },
      );
    }

    // Verify Pro subscription
    const isPro = await hasActiveProSubscription(supabase, user.id);
    if (!isPro) {
      return NextResponse.json(
        { error: 'Le sessioni live sono riservate agli abbonati Pro.' } satisfies ApiError,
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

    // Verify booking
    const { data: booking } = await admin
      .from('live_session_bookings')
      .select('id')
      .eq('session_id', params.sessionId)
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .single();

    if (!booking) {
      return NextResponse.json(
        { error: 'Non hai prenotato questa sessione.' } satisfies ApiError,
        { status: 403 },
      );
    }

    // Fetch session (excluding mux_stream_key)
    const { data: session } = await admin
      .from('live_sessions')
      .select('id, type, status, is_published, mux_playback_id, meeting_url, mux_replay_playback_id')
      .eq('id', params.sessionId)
      .single();

    if (!session || !session.is_published) {
      return NextResponse.json(
        { error: 'Sessione non trovata.' } satisfies ApiError,
        { status: 404 },
      );
    }

    // For webinar — return signed playback tokens
    if (session.type === 'webinar') {
      // Allow joining if live or ended (for replay)
      const playbackId = session.status === 'live'
        ? session.mux_playback_id
        : session.mux_replay_playback_id;

      if (!playbackId) {
        return NextResponse.json(
          { error: session.status === 'scheduled'
            ? 'La sessione non è ancora iniziata.'
            : 'Stream non disponibile.' } satisfies ApiError,
          { status: 400 },
        );
      }

      const tokens = generatePlaybackTokens(playbackId);

      const response: JoinSessionResponse = {
        type: 'webinar',
        playbackId,
        playbackToken: tokens.playback,
        thumbnailToken: tokens.thumbnail,
        storyboardToken: tokens.storyboard,
      };

      return NextResponse.json(response);
    }

    // For mentoring — return meeting URL
    if (session.type === 'mentoring') {
      if (!session.meeting_url) {
        return NextResponse.json(
          { error: 'Link meeting non ancora disponibile.' } satisfies ApiError,
          { status: 400 },
        );
      }

      const response: JoinSessionResponse = {
        type: 'mentoring',
        meetingUrl: session.meeting_url,
      };

      return NextResponse.json(response);
    }

    return NextResponse.json(
      { error: 'Tipo sessione non supportato.' } satisfies ApiError,
      { status: 400 },
    );
  } catch (err) {
    console.error('Join session error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
