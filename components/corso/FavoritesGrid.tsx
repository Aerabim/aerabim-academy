'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { formatPrice, formatDuration } from '@/lib/utils';
import { AREA_CONFIG, LEVEL_LABELS } from '@/lib/area-config';
import { Badge } from '@/components/ui/Badge';
import { FavoriteButton } from '@/components/corso/FavoriteButton';
import type { CourseWithMeta } from '@/types';

interface FavoritesGridProps {
  courses: CourseWithMeta[];
}

export function FavoritesGrid({ courses }: FavoritesGridProps) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const visibleCourses = courses.filter((c) => !removedIds.has(c.id));

  if (visibleCourses.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted text-sm">Hai rimosso tutti i preferiti da questa pagina.</p>
        <Link href="/catalogo-corsi" className="text-accent-cyan text-sm mt-2 inline-block hover:underline">
          Esplora il catalogo
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {visibleCourses.map((course) => (
        <FavoriteCard
          key={course.id}
          course={course}
          onRemoved={(id) => setRemovedIds((prev) => { const next = new Set(Array.from(prev)); next.add(id); return next; })}
        />
      ))}
    </div>
  );
}

function FavoriteCard({
  course,
  onRemoved,
}: {
  course: CourseWithMeta;
  onRemoved: (id: string) => void;
}) {
  const area = AREA_CONFIG[course.area];

  async function handleUnfavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id }),
      });
      if (res.ok) {
        onRemoved(course.id);
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="group relative rounded-md origin-top transition-all duration-300 hover:scale-[1.04] hover:z-10">
      {/* Cover 16:9 */}
      <div className="relative w-full aspect-video overflow-hidden rounded-md">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className={cn('absolute inset-0 bg-gradient-to-br flex items-center justify-center', area.cardGradient)}>
            <span className="text-5xl opacity-70">{course.emoji}</span>
          </div>
        )}

        {/* Gradient permanente */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-0/85 via-surface-0/20 to-transparent pointer-events-none" />

        {/* Remove button — top-left */}
        <button
          onClick={handleUnfavorite}
          title="Rimuovi dai preferiti"
          className="absolute top-2.5 left-2.5 p-1.5 rounded-full bg-surface-0/70 backdrop-blur-sm hover:bg-surface-0/90 transition-all z-30"
        >
          <svg width="14" height="14" fill="currentColor" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-accent-cyan">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        </button>

        {/* Level badge — top-right */}
        <span className="absolute top-2.5 right-2.5 z-20 font-heading text-[0.62rem] font-bold bg-surface-0/70 backdrop-blur-sm text-text-primary px-2 py-0.5 rounded">
          {LEVEL_LABELS[course.level]}
        </span>

        {/* Overlay testo — bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-3 pt-6 pointer-events-none">
          <Badge variant={area.badgeVariant} className="mb-1 text-[0.58rem]">{area.label}</Badge>
          <h3 className="font-heading text-[0.8rem] font-bold text-text-primary leading-snug line-clamp-2">
            {course.title}
          </h3>
          <div className="flex items-center justify-between mt-1 text-[0.68rem] text-text-muted">
            <span>{formatDuration(course.durationMin)}</span>
            <span className={cn('font-heading font-bold', course.isFree ? 'text-accent-emerald' : 'text-accent-cyan')}>
              {formatPrice(course.priceSingle)}
            </span>
          </div>
        </div>
      </div>

      {/* Link — tutta la card cliccabile */}
      <Link href={`/catalogo-corsi/${course.slug}`} className="absolute inset-0 z-10" aria-label={course.title} />
    </div>
  );
}
