import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, UpdateSimulationPayload } from '@/types';

interface RouteParams {
  params: { simId: string };
}

/** PATCH /api/admin/simulations/[simId] — update descrizione, thumbnailUrl, comingSoon */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { simId } = params;
    const body = (await req.json()) as UpdateSimulationPayload & { pathId?: string | null };

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.descrizione !== undefined)  updateData.descrizione    = body.descrizione;
    if (body.thumbnailUrl !== undefined) updateData.thumbnail_url  = body.thumbnailUrl;
    if (body.comingSoon !== undefined)   updateData.coming_soon    = body.comingSoon;
    if ('pathId' in body)               updateData.path_id        = body.pathId ?? null;

    if (Object.keys(updateData).length === 1) {
      return NextResponse.json(
        { error: 'Nessun campo da aggiornare.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const { data, error } = await admin
      .from('simulations')
      .update(updateData)
      .eq('id', simId)
      .select('id, slug, figura, tipo, coming_soon, thumbnail_url')
      .single();

    if (error || !data) {
      console.error('Update simulation error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento della simulazione.' } satisfies ApiError,
        { status: 500 },
      );
    }

    revalidatePath('/simulazioni');
    revalidatePath('/admin/simulazioni');

    return NextResponse.json({ simulation: data });
  } catch (err) {
    console.error('PATCH /api/admin/simulations/[simId] error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
