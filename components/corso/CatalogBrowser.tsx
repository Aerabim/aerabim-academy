'use client';

import { useState, useMemo } from 'react';
import { CategoryFilter } from '@/components/corso/CategoryFilter';
import { CourseRow } from '@/components/corso/CourseRow';
import { AREA_CONFIG, type CategoryFilterValue } from '@/lib/area-config';
import type { AreaCode, CourseWithMeta } from '@/types';

interface CatalogBrowserProps {
  courses: CourseWithMeta[];
}

const AREA_ORDER: AreaCode[] = ['SW', 'NL', 'OB', 'PG', 'AI'];

export function CatalogBrowser({ courses }: CatalogBrowserProps) {
  const [active, setActive] = useState<CategoryFilterValue>('all');

  const grouped = useMemo(() => {
    const filtered = active === 'all' ? courses : courses.filter((c) => c.area === active);
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
  }, [courses, active]);

  return (
    <div className="space-y-8">
      <CategoryFilter active={active} onChange={setActive} />
      {grouped.map((group) => (
        <CourseRow
          key={group.area}
          title={group.title}
          count={group.courses.length}
          courses={group.courses}
        />
      ))}
      {grouped.length === 0 && (
        <p className="text-text-muted text-sm py-12 text-center">
          Nessun corso trovato in questa categoria.
        </p>
      )}
    </div>
  );
}
