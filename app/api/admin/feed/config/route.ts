import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, FeedConfig } from '@/types';

/** GET /api/admin/feed/config — returns global feed source toggles */
export async function GET() {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { data, error } = await admin
      .from('feed_config')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Errore nel caricamento config.' } satisfies ApiError, { status: 500 });
    }

    const row = (data ?? {
      progress_enabled: true,
      certificates_enabled: true,
      enrollments_enabled: true,
      discussions_enabled: true,
    }) as {
      progress_enabled: boolean;
      certificates_enabled: boolean;
      enrollments_enabled: boolean;
      discussions_enabled: boolean;
    };

    const config: FeedConfig = {
      progressEnabled: row.progress_enabled,
      certificatesEnabled: row.certificates_enabled,
      enrollmentsEnabled: row.enrollments_enabled,
      discussionsEnabled: row.discussions_enabled,
    };

    return NextResponse.json({ config });
  } catch (err) {
    console.error('GET /api/admin/feed/config error:', err);
    return NextResponse.json({ error: 'Errore interno.' } satisfies ApiError, { status: 500 });
  }
}

/** PATCH /api/admin/feed/config — updates global feed source toggles */
export async function PATCH(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = await req.json() as Partial<FeedConfig>;

    const updateData: Record<string, unknown> = {};
    if (body.progressEnabled !== undefined) updateData.progress_enabled = body.progressEnabled;
    if (body.certificatesEnabled !== undefined) updateData.certificates_enabled = body.certificatesEnabled;
    if (body.enrollmentsEnabled !== undefined) updateData.enrollments_enabled = body.enrollmentsEnabled;
    if (body.discussionsEnabled !== undefined) updateData.discussions_enabled = body.discussionsEnabled;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nessun campo da aggiornare.' } satisfies ApiError, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { error } = await admin
      .from('feed_config')
      .update(updateData)
      .eq('id', 1);

    if (error) {
      console.error('PATCH feed_config error:', error);
      return NextResponse.json({ error: 'Errore durante il salvataggio.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/admin/feed/config error:', err);
    return NextResponse.json({ error: 'Errore interno.' } satisfies ApiError, { status: 500 });
  }
}
