import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** Mux webhook event payload (typed for the events we handle) */
interface MuxWebhookEvent {
  type: string;
  data: {
    id: string;
    playback_ids?: { id: string; policy: string }[];
    duration?: number;
    passthrough?: string;
    errors?: { type: string; messages: string[] };
    // Live stream fields
    active_asset_id?: string;
  };
}

/** Shape of our passthrough JSON set during upload creation */
interface MuxPassthrough {
  lessonId: string;
  courseId: string;
}

/** Shape of passthrough for live stream events */
interface MuxLivePassthrough {
  sessionId: string;
}

export async function POST(request: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Database admin non configurato' }, { status: 503 });
  }

  // 1. Read raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get('mux-signature');

  if (!signature || !process.env.MUX_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Firma webhook mancante' }, { status: 400 });
  }

  // 2. Verify signature using Mux SDK
  const mux = new Mux();
  let event: MuxWebhookEvent;
  try {
    const headers: Record<string, string> = { 'mux-signature': signature };
    event = mux.webhooks.unwrap(body, headers, process.env.MUX_WEBHOOK_SECRET) as MuxWebhookEvent;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Firma non valida';
    console.error('[mux/webhook] Signature verification failed:', message);
    return NextResponse.json({ error: `Firma non valida: ${message}` }, { status: 400 });
  }

  // 3. Handle events
  try {
    switch (event.type) {
      case 'video.asset.ready': {
        await handleAssetReady(event, admin);
        break;
      }
      case 'video.asset.errored': {
        await handleAssetErrored(event, admin);
        break;
      }
      case 'video.live_stream.active': {
        await handleLiveStreamActive(event, admin);
        break;
      }
      case 'video.live_stream.idle': {
        await handleLiveStreamIdle(event, admin);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error(`[mux/webhook] Handler error for ${event.type}:`, err);
    return NextResponse.json({ error: 'Errore interno webhook' }, { status: 500 });
  }
}

// ── Event Handlers ──────────────────────────────────

async function handleAssetReady(
  event: MuxWebhookEvent,
  admin: ReturnType<typeof getSupabaseAdmin> & object,
) {
  const { id: assetId, playback_ids, duration, passthrough } = event.data;

  if (!passthrough) {
    console.error('[mux/webhook] video.asset.ready: passthrough mancante');
    return;
  }

  const playbackId = playback_ids?.[0]?.id ?? null;

  // Try to parse as lesson passthrough (VOD upload)
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(passthrough) as Record<string, unknown>;
  } catch {
    console.error('[mux/webhook] video.asset.ready: passthrough non valido');
    return;
  }

  // Case 1: VOD asset for a lesson
  if ('lessonId' in parsed && typeof parsed.lessonId === 'string') {
    const durationSec = duration ? Math.round(duration) : null;

    const { error } = await admin
      .from('lessons')
      .update({
        mux_asset_id: assetId,
        mux_playback_id: playbackId,
        mux_status: 'ready',
        duration_sec: durationSec,
      })
      .eq('id', parsed.lessonId);

    if (error) {
      console.error('[mux/webhook] Errore aggiornamento lesson (ready):', error);
      throw error;
    }

    console.log(`[mux/webhook] Lesson ${parsed.lessonId} ready — asset ${assetId}`);
    return;
  }

  // Case 2: Preview clip for a course
  if ('type' in parsed && parsed.type === 'preview' && 'courseId' in parsed && typeof parsed.courseId === 'string') {
    if (!playbackId) {
      console.error('[mux/webhook] Preview asset ready but no playback ID');
      return;
    }

    const { error } = await admin
      .from('courses')
      .update({
        preview_asset_id: assetId,
        preview_playback_id: playbackId,
      })
      .eq('id', parsed.courseId);

    if (error) {
      console.error('[mux/webhook] Errore aggiornamento preview corso:', error);
      throw error;
    }

    console.log(`[mux/webhook] Course ${parsed.courseId} preview ready — asset ${assetId}`);
    return;
  }

  // Case 3: Recording asset from a live stream (replay)
  if ('sessionId' in parsed && typeof parsed.sessionId === 'string') {
    if (!playbackId) {
      console.error('[mux/webhook] Recording asset ready but no playback ID');
      return;
    }

    const { error } = await admin
      .from('live_sessions')
      .update({ mux_replay_playback_id: playbackId })
      .eq('id', parsed.sessionId);

    if (error) {
      console.error('[mux/webhook] Errore aggiornamento replay sessione:', error);
      throw error;
    }

    console.log(`[mux/webhook] Session ${parsed.sessionId} replay ready — asset ${assetId}`);
    return;
  }

  console.warn('[mux/webhook] video.asset.ready: passthrough non riconosciuto:', passthrough);
}

async function handleAssetErrored(
  event: MuxWebhookEvent,
  admin: ReturnType<typeof getSupabaseAdmin> & object,
) {
  const { passthrough, errors } = event.data;

  if (!passthrough) {
    console.error('[mux/webhook] video.asset.errored: passthrough mancante');
    return;
  }

  const { lessonId } = JSON.parse(passthrough) as MuxPassthrough;

  console.error(
    `[mux/webhook] Asset errored for lesson ${lessonId}:`,
    JSON.stringify(errors),
  );

  const { error } = await admin
    .from('lessons')
    .update({ mux_status: 'errored' })
    .eq('id', lessonId);

  if (error) {
    console.error('[mux/webhook] Errore aggiornamento lesson (errored):', error);
    throw error;
  }
}

// ── Live Stream Event Handlers ──────────────────────

async function handleLiveStreamActive(
  event: MuxWebhookEvent,
  admin: ReturnType<typeof getSupabaseAdmin> & object,
) {
  const { id: liveStreamId, passthrough } = event.data;

  // Try passthrough first, then fall back to matching by mux_live_stream_id
  let sessionId: string | null = null;
  if (passthrough) {
    try {
      const parsed = JSON.parse(passthrough) as MuxLivePassthrough;
      sessionId = parsed.sessionId;
    } catch {
      // Not a valid JSON passthrough
    }
  }

  if (sessionId) {
    const { error } = await admin
      .from('live_sessions')
      .update({ status: 'live' })
      .eq('id', sessionId);

    if (error) {
      console.error('[mux/webhook] Errore aggiornamento sessione (live):', error);
      throw error;
    }
  } else {
    // Fall back to matching by mux_live_stream_id
    const { error } = await admin
      .from('live_sessions')
      .update({ status: 'live' })
      .eq('mux_live_stream_id', liveStreamId);

    if (error) {
      console.error('[mux/webhook] Errore aggiornamento sessione per stream_id (live):', error);
      throw error;
    }
  }

  console.log(`[mux/webhook] Live stream ${liveStreamId} is now active`);
}

async function handleLiveStreamIdle(
  event: MuxWebhookEvent,
  admin: ReturnType<typeof getSupabaseAdmin> & object,
) {
  const { id: liveStreamId, passthrough, active_asset_id } = event.data;

  let sessionId: string | null = null;
  if (passthrough) {
    try {
      const parsed = JSON.parse(passthrough) as MuxLivePassthrough;
      sessionId = parsed.sessionId;
    } catch {
      // Not a valid JSON passthrough
    }
  }

  const updateData: Record<string, unknown> = { status: 'ended' };

  // If there's a recording asset, we'll get a separate video.asset.ready event
  // for it. For now, just mark the session as ended.
  // The replay playback ID will be set when the recording asset is ready.
  if (active_asset_id) {
    console.log(`[mux/webhook] Live stream ${liveStreamId} idle — recording asset: ${active_asset_id}`);
  }

  if (sessionId) {
    const { error } = await admin
      .from('live_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) {
      console.error('[mux/webhook] Errore aggiornamento sessione (ended):', error);
      throw error;
    }
  } else {
    const { error } = await admin
      .from('live_sessions')
      .update(updateData)
      .eq('mux_live_stream_id', liveStreamId);

    if (error) {
      console.error('[mux/webhook] Errore aggiornamento sessione per stream_id (ended):', error);
      throw error;
    }
  }

  console.log(`[mux/webhook] Live stream ${liveStreamId} is now idle (ended)`);
}
