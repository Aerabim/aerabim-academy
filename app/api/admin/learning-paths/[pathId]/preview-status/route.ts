import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import { getMuxClient } from '@/lib/mux/helpers';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { pathId: string };
}

/**
 * GET /api/admin/learning-paths/[pathId]/preview-status?uploadId=...
 *
 * Polls for Mux preview video readiness.
 * 1. Checks the DB for preview_playback_id (set by the Mux webhook in production).
 * 2. If not set yet and uploadId is provided, queries the Mux API directly
 *    so the endpoint works in local dev where the webhook can't reach localhost.
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { pathId } = params;
    const { searchParams } = new URL(req.url);
    const uploadId = searchParams.get('uploadId');

    // 1. Check DB first (covers the production webhook path)
    const { data, error } = await admin
      .from('learning_paths')
      .select('preview_playback_id, preview_asset_id')
      .eq('id', pathId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Percorso non trovato.' } satisfies ApiError,
        { status: 404 },
      );
    }

    const row = data as { preview_playback_id: string | null; preview_asset_id: string | null };

    if (row.preview_playback_id) {
      return NextResponse.json({
        previewPlaybackId: row.preview_playback_id,
        previewAssetId: row.preview_asset_id,
      });
    }

    // 2. DB still empty — query Mux directly if uploadId is available
    //    (covers local dev where the webhook can't reach localhost)
    if (uploadId) {
      const mux = getMuxClient();
      if (mux) {
        try {
          const upload = await mux.video.uploads.retrieve(uploadId);

          if (upload.asset_id) {
            const asset = await mux.video.assets.retrieve(upload.asset_id);

            if (asset.status === 'ready' && asset.playback_ids && asset.playback_ids.length > 0) {
              const playbackId = asset.playback_ids[0].id;
              const assetId = asset.id;

              // Write to DB so subsequent requests hit the fast path
              await admin
                .from('learning_paths')
                .update({ preview_playback_id: playbackId, preview_asset_id: assetId })
                .eq('id', pathId);

              return NextResponse.json({
                previewPlaybackId: playbackId,
                previewAssetId: assetId,
              });
            }
          }
        } catch (muxErr) {
          // Non-fatal: log and fall through to return null
          console.warn('[preview-status] Mux API check failed:', muxErr);
        }
      }
    }

    // Not ready yet
    return NextResponse.json({
      previewPlaybackId: null,
      previewAssetId: null,
    });
  } catch (err) {
    console.error('GET /api/admin/learning-paths/[pathId]/preview-status error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
