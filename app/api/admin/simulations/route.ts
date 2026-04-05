import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, SimulationRow } from '@/types';

/** GET /api/admin/simulations — list all 14 simulations ordered by order_num */
export async function GET() {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { data, error } = await admin
      .from('simulations')
      .select('id, slug, figura, tipo, descrizione, domande, durata_min, thumbnail_url, coming_soon, order_num')
      .order('order_num', { ascending: true });

    if (error) {
      console.error('GET simulations error:', error);
      return NextResponse.json(
        { error: 'Errore nel caricamento delle simulazioni.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const simulations: SimulationRow[] = (data ?? []).map((row) => ({
      id: (row as Record<string, unknown>).id as string,
      slug: (row as Record<string, unknown>).slug as string,
      figura: (row as Record<string, unknown>).figura as string,
      tipo: (row as Record<string, unknown>).tipo as 'scritto' | 'pratico',
      descrizione: (row as Record<string, unknown>).descrizione as string | null,
      domande: (row as Record<string, unknown>).domande as number | null,
      durataMin: (row as Record<string, unknown>).durata_min as number,
      thumbnailUrl: (row as Record<string, unknown>).thumbnail_url as string | null,
      comingSoon: (row as Record<string, unknown>).coming_soon as boolean,
      orderNum: (row as Record<string, unknown>).order_num as number,
    }));

    return NextResponse.json({ simulations });
  } catch (err) {
    console.error('GET /api/admin/simulations error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
