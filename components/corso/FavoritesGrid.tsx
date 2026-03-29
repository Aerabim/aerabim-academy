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
    <Link
      href={`/catalogo-corsi/${course.slug}`}
      className="group rounded-md overflow-hidden transition-transform duration-300 hover:scale-[1.03] hover:z-10"
    >
      {/* Cover */}
      <div
        className={cn(
          'relative h-[160px] bg-gradient-to-br flex items-center justify-center',
          area.cardGradient,
        )}
      >
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <span className="text-5xl opacity-80">{course.emoji}</span>
        )}

        {/* Remove button */}
        <button
          onClick={handleUnfavorite}
          title="Rimuovi dai preferiti"
          className="absolute top-3 left-3 p-1.5 rounded-full bg-surface-0/70 backdrop-blur-sm hover:bg-surface-0/90 transition-all z-10"
        >
          <svg
            width="16"
            height="16"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
            className="text-accent-cyan"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        </button>

        {/* Level badge */}
        <span className="absolute top-3 right-3 font-heading text-[0.65rem] font-bold bg-surface-0/70 backdrop-blur-sm text-text-primary px-2 py-0.5 rounded">
          {LEVEL_LABELS[course.level]}
        </span>

        {/* Price */}
        <span
          className={cn(
            'absolute bottom-3 right-3 font-heading text-[0.7rem] font-bold px-2 py-0.5 rounded',
            course.isFree
              ? 'bg-accent-emerald/20 text-accent-emerald'
              : 'bg-surface-0/70 backdrop-blur-sm text-text-primary',
          )}
        >
          {formatPrice(course.priceSingle)}
        </span>
      </div>

      {/* Body */}
      <div className="bg-surface-1 border border-t-0 border-border-subtle p-3.5 pb-4">
        <Badge variant={area.badgeVariant} className="mb-2">
          {area.label}
        </Badge>
        <h3 className="font-heading text-[0.84rem] font-semibold text-text-primary leading-snug line-clamp-2 min-h-[2.5rem]">
          {course.title}
        </h3>
        <div className="flex items-center justify-between mt-3 text-[0.72rem] text-text-muted">
          <span>{formatDuration(course.durationMin)}</span>
          <span className="flex items-center gap-1">
            <span className="text-accent-amber">&#9733;</span> {course.rating}
          </span>
        </div>
      </div>
    </Link>
  );
}
