import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createMuxLiveStream } from '@/lib/mux/helpers';
import type { CreateLiveSessionRequest, ApiError } from '@/types';

const MUX_RTMP_URL = 'rtmp://global-live.mux.com:5222/app';

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

    // Admin check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const profileRow = profile as { role: string } | null;
    if (!profileRow || profileRow.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accesso non autorizzato.' } satisfies ApiError,
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

    const body = (await req.json()) as CreateLiveSessionRequest;

    // Validate required fields
    if (!body.title || !body.type || !body.hostName || !body.scheduledAt) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti: title, type, hostName, scheduledAt.' } satisfies ApiError,
        { status: 400 },
      );
    }

    if (body.type !== 'webinar' && body.type !== 'mentoring') {
      return NextResponse.json(
        { error: 'Tipo sessione non valido. Usa "webinar" o "mentoring".' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Build insert payload
    const insertData: Record<string, unknown> = {
      type: body.type,
      title: body.title,
      description: body.description ?? null,
      host_name: body.hostName,
      scheduled_at: body.scheduledAt,
      duration_min: body.durationMin ?? 60,
      max_participants: body.maxParticipants ?? (body.type === 'mentoring' ? 1 : null),
      is_published: false,
    };

    // For webinar: create Mux live stream
    let streamKey: string | undefined;
    if (body.type === 'webinar') {
      // We'll create the live stream after inserting the session
      // to get the session ID for the passthrough
    }

    // For mentoring: store meeting URL
    if (body.type === 'mentoring') {
      insertData.meeting_url = body.meetingUrl ?? null;
    }

    // Insert session
    const { data: session, error: insertError } = await admin
      .from('live_sessions')
      .insert(insertData)
      .select('id, type, title, description, host_name, scheduled_at, duration_min, max_participants, status, mux_playback_id, meeting_url, mux_replay_playback_id, is_published, created_at')
      .single();

    if (insertError || !session) {
      console.error('Insert session error:', insertError);
      return NextResponse.json(
        { error: 'Errore durante la creazione della sessione.' } satisfies ApiError,
        { status: 500 },
      );
    }

    // For webinar: create Mux live stream and update session
    if (body.type === 'webinar') {
      try {
        const muxResult = await createMuxLiveStream(session.id);
        streamKey = muxResult.streamKey;

        const { error: updateError } = await admin
          .from('live_sessions')
          .update({
            mux_live_stream_id: muxResult.liveStreamId,
            mux_playback_id: muxResult.playbackId,
            mux_stream_key: muxResult.streamKey,
          })
          .eq('id', session.id);

        if (updateError) {
          console.error('Update Mux fields error:', updateError);
        }

        session.mux_playback_id = muxResult.playbackId;
      } catch (err) {
        console.error('Mux live stream creation error:', err);
        // Session created but Mux failed — admin can retry
      }
    }

    return NextResponse.json({
      session: {
        id: session.id,
        type: session.type,
        title: session.title,
        description: session.description,
        hostName: session.host_name,
        scheduledAt: session.scheduled_at,
        durationMin: session.duration_min,
        maxParticipants: session.max_participants,
        status: session.status,
        muxPlaybackId: session.mux_playback_id,
        meetingUrl: session.meeting_url,
        muxReplayPlaybackId: session.mux_replay_playback_id,
        isPublished: session.is_published,
        createdAt: session.created_at,
      },
      streamKey,
      rtmpUrl: body.type === 'webinar' ? MUX_RTMP_URL : undefined,
    });
  } catch (err) {
    console.error('Create session error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
