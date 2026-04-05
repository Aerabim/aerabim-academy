import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { SimulazioniHero } from '@/components/simulazioni/SimulazioniHero';
import { SimulazioniGrid } from '@/components/simulazioni/SimulazioniGrid';
import { BookExamCtaBanner } from '@/components/simulazioni/BookExamCtaBanner';
import type { SimulationRow } from '@/types';

export default async function SimulazioniPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = getSupabaseAdmin();

  let simulations: SimulationRow[] = [];
  let enrolledPathIds = new Set<string>();
  // Map pathId → slug for CTA links
  const pathSlugMap = new Map<string, string>();

  if (admin) {
    try {
      // Fetch simulazioni + percorso associato (slug)
      const { data: simsData } = await admin
        .from('simulations')
        .select('id, slug, figura, tipo, descrizione, domande, durata_min, thumbnail_url, coming_soon, order_num, path_id, learning_paths(slug)')
        .order('order_num', { ascending: true });

      simulations = (simsData ?? []).map((row) => {
        const r = row as Record<string, unknown>;
        const pathId = r.path_id as string | null;
        const lp = r.learning_paths as { slug: string } | null;
        if (pathId && lp?.slug) pathSlugMap.set(pathId, lp.slug);

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
          pathId,
        };
      });

      // Fetch enrollment percorsi utente
      if (user) {
        const { data: enrollData } = await supabase
          .from('learning_path_enrollments')
          .select('path_id')
          .eq('user_id', user.id);

        enrolledPathIds = new Set(
          (enrollData ?? []).map((e) => (e as { path_id: string }).path_id),
        );
      }
    } catch (err) {
      console.error('SimulazioniPage fetch error:', err);
    }
  }

  return (
    <div className="w-full px-6 lg:px-9 pt-3 pb-7 space-y-6">
      <SimulazioniHero />
      <SimulazioniGrid
        simulations={simulations}
        enrolledPathIds={enrolledPathIds}
        pathSlugMap={pathSlugMap}
      />
      <BookExamCtaBanner />
    </div>
  );
}
