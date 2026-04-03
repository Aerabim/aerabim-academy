import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { courseId: string };
}

/** GET /api/admin/courses/[courseId]/preview-status — poll for preview video readiness */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { data, error } = await admin
      .from('courses')
      .select('preview_playback_id, preview_asset_id')
      .eq('id', params.courseId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Corso non trovato.' } satisfies ApiError,
        { status: 404 },
      );
    }

    const row = data as { preview_playback_id: string | null; preview_asset_id: string | null };
    return NextResponse.json({
      previewPlaybackId: row.preview_playback_id,
      previewAssetId: row.preview_asset_id,
    });
  } catch (err) {
    console.error('GET preview-status error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
