export const dynamic = 'force-dynamic';

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { SimulationTable } from '@/components/admin/simulazioni/SimulationTable';
import type { SimulationRow } from '@/types';

export default async function AdminSimulazioniPage() {
  const admin = getSupabaseAdmin();
  let simulations: SimulationRow[] = [];

  if (admin) {
    try {
      const { data } = await admin
        .from('simulations')
        .select('id, slug, figura, tipo, descrizione, domande, durata_min, thumbnail_url, coming_soon, order_num')
        .order('order_num', { ascending: true });

      simulations = (data ?? []).map((row) => {
        const r = row as Record<string, unknown>;
        return {
          id: r.id as string,
          slug: r.slug as string,
          figura: r.figura as string,
          tipo: r.tipo as 'scritto' | 'pratico',
          descrizione: r.descrizione as string | null,
          domande: r.domande as number | null,
          durataMin: r.durata_min as number,
          thumbnailUrl: r.thumbnail_url as string | null,
          comingSoon: r.coming_soon as boolean,
          orderNum: r.order_num as number,
        };
      });
    } catch (err) {
      console.error('Admin simulazioni page error:', err);
    }
  }

  return (
    <div className="p-6 lg:p-10 w-full">
      <div className="mb-6">
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">
          Gestione Simulazioni
        </h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">
          Gestisci immagini, descrizioni e disponibilità delle 14 simulazioni d&apos;esame.
        </p>
      </div>
      <SimulationTable simulations={simulations} />
    </div>
  );
}
