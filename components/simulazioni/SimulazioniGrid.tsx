'use client';

import { SimulazioneCard } from './SimulazioneCard';
import type { SimulazioneItem } from './SimulazioneCard';
import type { SimulationRow } from '@/types';

interface SimulazioniGridProps {
  simulations: SimulationRow[];
  enrolledPathIds: Set<string>;
  pathSlugMap: Map<string, string>;
}

export function SimulazioniGrid({ simulations, enrolledPathIds, pathSlugMap }: SimulazioniGridProps) {
  const items: (SimulazioneItem & { locked: boolean; pathSlug: string | undefined })[] = simulations.map((row) => {
    const locked =
      !row.comingSoon &&
      row.pathId !== null &&
      !enrolledPathIds.has(row.pathId);

    return {
      id: row.id,
      figura: row.figura,
      tipo: row.tipo,
      descrizione: row.descrizione ?? '',
      domande: row.domande ?? undefined,
      durataMin: row.durataMin,
      thumbnailUrl: row.thumbnailUrl,
      comingSoon: row.comingSoon,
      href: `/simulazioni/${row.slug}`,
      locked,
      pathSlug: row.pathId ? pathSlugMap.get(row.pathId) : undefined,
    };
  });

  return (
    <div>
      <p className="text-[0.72rem] font-bold uppercase tracking-widest text-text-muted mb-4">
        Scegli la simulazione
      </p>
      <div className="grid grid-cols-2 gap-4 md:gap-5">
        {items.map((item, i) => (
          <SimulazioneCard
            key={item.id}
            item={item}
            index={i}
            locked={item.locked}
            pathSlug={item.pathSlug}
          />
        ))}
      </div>
    </div>
  );
}
