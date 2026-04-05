export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { SimulationEditForm } from '@/components/admin/simulazioni/SimulationEditForm';
import type { SimulationRow } from '@/types';

interface PageProps {
  params: { simId: string };
}

export default async function AdminSimulazioneEditPage({ params }: PageProps) {
  const admin = getSupabaseAdmin();
  let simulation: SimulationRow | null = null;

  if (admin) {
    try {
      const { data } = await admin
        .from('simulations')
        .select('id, slug, figura, tipo, descrizione, domande, durata_min, thumbnail_url, coming_soon, order_num')
        .eq('id', params.simId)
        .single();

      if (data) {
        const r = data as Record<string, unknown>;
        simulation = {
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
      }
    } catch (err) {
      console.error('Admin simulazione edit page error:', err);
    }
  }

  if (!simulation) notFound();

  return (
    <div className="p-6 lg:p-10 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[0.78rem] text-text-muted mb-6">
        <Link href="/admin/simulazioni" className="hover:text-text-primary transition-colors">
          Simulazioni
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{simulation.figura}</span>
        <span>/</span>
        <span className="capitalize">{simulation.tipo}</span>
      </div>

      <div className="mb-7">
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">
          Modifica simulazione
        </h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">
          Aggiorna immagine, descrizione e disponibilità.
        </p>
      </div>

      <SimulationEditForm simulation={simulation} />
    </div>
  );
}
