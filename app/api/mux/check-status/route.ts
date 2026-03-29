import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getMuxClient } from '@/lib/mux/helpers';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

interface CheckStatusBody {
  lessonId: string;
  uploadId?: string;
}

/**
 * POST /api/mux/check-status
 * Checks the Mux asset status for a lesson and updates the DB if ready.
 * Useful in development where Mux webhooks can't reach localhost.
 *
 * If the lesson has no mux_asset_id yet (webhook hasn't fired), uses
 * the uploadId to find the asset via the Mux Upload API.
 */
export async function POST(request: Request) {
  try {
    // 1. Auth + admin check
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Autenticazione richiesta' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Accesso riservato agli amministratori' }, { status: 403 });
    }

    const body = await request.json() as CheckStatusBody;
    if (!body.lessonId) {
      return NextResponse.json({ error: 'lessonId obbligatorio' }, { status: 400 });
    }

    const mux = getMuxClient();
    if (!mux) {
      return NextResponse.json({ error: 'Mux non configurato' }, { status: 503 });
    }

    // 2. Get current lesson state
    const { data: lesson } = await supabase
      .from('lessons')
      .select('mux_asset_id, mux_status')
      .eq('id', body.lessonId)
      .single<{ mux_asset_id: string | null; mux_status: string }>();

    let assetId = lesson?.mux_asset_id ?? null;

    // 3. If no asset_id in DB, try to find it via the upload
    if (!assetId && body.uploadId) {
      try {
        const upload = await mux.video.uploads.retrieve(body.uploadId);
        if (upload.asset_id) {
          assetId = upload.asset_id;
        }
      } catch {
        // Upload not found or expired
      }
    }

    if (!assetId) {
      return NextResponse.json({ status: lesson?.mux_status ?? 'waiting' });
    }

    // 4. Check asset status on Mux
    const asset = await mux.video.assets.retrieve(assetId);
    const muxStatus = asset.status === 'ready' ? 'ready' : asset.status === 'errored' ? 'errored' : 'preparing';

    // 5. Update DB if status changed or if asset_id was missing
    const admin = getSupabaseAdmin();
    if (admin) {
      const needsUpdate = muxStatus !== lesson?.mux_status || !lesson?.mux_asset_id;

      if (needsUpdate) {
        const updateData: Record<string, unknown> = {
          mux_status: muxStatus,
          mux_asset_id: assetId,
        };

        if (muxStatus === 'ready') {
          updateData.mux_playback_id = asset.playback_ids?.[0]?.id ?? null;
          updateData.duration_sec = asset.duration ? Math.round(asset.duration) : null;
        }

        await admin
          .from('lessons')
          .update(updateData)
          .eq('id', body.lessonId);
      }
    }

    const playbackId = asset.playback_ids?.[0]?.id ?? null;
    const durationSec = asset.duration ? Math.round(asset.duration) : null;

    return NextResponse.json({ status: muxStatus, playbackId, durationSec });
  } catch (err) {
    console.error('[mux/check-status]', err);
    return NextResponse.json({ error: 'Errore verifica stato' }, { status: 500 });
  }
}
