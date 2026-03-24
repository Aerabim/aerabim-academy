'use client';

import { useState, useMemo } from 'react';
import { CategoryFilter } from '@/components/corso/CategoryFilter';
import { CourseRow } from '@/components/corso/CourseRow';
import { useSearch } from '@/lib/search-context';
import { useFavorites } from '@/lib/favorites/use-favorites';
import { AREA_CONFIG, type CategoryFilterValue } from '@/lib/area-config';
import type { AreaCode, CourseWithMeta } from '@/types';

interface CatalogBrowserProps {
  courses: CourseWithMeta[];
}

const AREA_ORDER: AreaCode[] = ['SW', 'NL', 'OB', 'PG', 'AI'];

export function CatalogBrowser({ courses }: CatalogBrowserProps) {
  const [active, setActive] = useState<CategoryFilterValue>('all');
  const { query: search } = useSearch();
  const { favoriteIds } = useFavorites();

  const grouped = useMemo(() => {
    let filtered = active === 'all' ? courses : courses.filter((c) => c.area === active);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)),
      );
    }

    const groups: { area: AreaCode; title: string; courses: CourseWithMeta[] }[] = [];

    for (const area of AREA_ORDER) {
      const areaCourses = filtered.filter((c) => c.area === area);
      if (areaCourses.length > 0) {
        groups.push({
          area,
          title: AREA_CONFIG[area].fullLabel,
          courses: areaCourses,
        });
      }
    }
    return groups;
  }, [courses, active, search]);

  const totalResults = grouped.reduce((sum, g) => sum + g.courses.length, 0);

  return (
    <div className="space-y-8">
      <CategoryFilter active={active} onChange={setActive} />

      {search.trim() && (
        <p className="text-text-muted text-[0.78rem]">
          {totalResults} {totalResults === 1 ? 'risultato' : 'risultati'} per &ldquo;{search.trim()}&rdquo;
        </p>
      )}

      {grouped.map((group) => (
        <CourseRow
          key={group.area}
          title={group.title}
          count={group.courses.length}
          courses={group.courses}
          favoriteIds={favoriteIds}
        />
      ))}
      {grouped.length === 0 && (
        <p className="text-text-muted text-sm py-12 text-center">
          {search.trim()
            ? 'Nessun corso trovato per la tua ricerca.'
            : 'Nessun corso trovato in questa categoria.'}
        </p>
      )}
    </div>
  );
}
