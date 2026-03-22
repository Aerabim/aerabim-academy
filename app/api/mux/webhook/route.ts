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
  };
}

/** Shape of our passthrough JSON set during upload creation */
interface MuxPassthrough {
  lessonId: string;
  courseId: string;
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

  const { lessonId } = JSON.parse(passthrough) as MuxPassthrough;

  const playbackId = playback_ids?.[0]?.id ?? null;
  const durationSec = duration ? Math.round(duration) : null;

  const { error } = await admin
    .from('lessons')
    .update({
      mux_asset_id: assetId,
      mux_playback_id: playbackId,
      mux_status: 'ready',
      duration_sec: durationSec,
    })
    .eq('id', lessonId);

  if (error) {
    console.error('[mux/webhook] Errore aggiornamento lesson (ready):', error);
    throw error;
  }

  console.log(`[mux/webhook] Lesson ${lessonId} ready — asset ${assetId}`);
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
