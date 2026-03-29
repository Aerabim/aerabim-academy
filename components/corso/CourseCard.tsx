'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatPrice, formatDuration } from '@/lib/utils';
import { AREA_CONFIG, LEVEL_LABELS, LEVEL_COLORS } from '@/lib/area-config';
import { Badge } from '@/components/ui/Badge';
import { FavoriteButton } from '@/components/corso/FavoriteButton';
import type { CourseWithMeta } from '@/types';

interface CourseCardProps {
  course: CourseWithMeta;
  isFavorited?: boolean;
}

export function CourseCard({ course, isFavorited = false }: CourseCardProps) {
  const area = AREA_CONFIG[course.area];
  const href = `/catalogo-corsi/${course.slug}`;

  return (
    <div className="group relative w-[280px] shrink-0 rounded-md overflow-hidden transition-transform duration-300 hover:scale-[1.06] hover:z-20">
      {/* Full-card navigation link (sits below interactive elements) */}
      <Link href={href} className="absolute inset-0 z-10" aria-label={course.title} />

      {/* Cover */}
      <div
        className={cn(
          'relative h-[160px] bg-gradient-to-br flex items-center justify-center overflow-hidden',
          area.cardGradient,
        )}
      >
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover"
            sizes="280px"
          />
        ) : (
          <span className="text-5xl opacity-80">{course.emoji}</span>
        )}

        {/* Favorite button — z-20 above the card link, always visible when favorited */}
        <div className={cn(
          'absolute top-3 left-3 z-20 transition-opacity duration-200',
          isFavorited ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}>
          <FavoriteButton
            courseId={course.id}
            initialFavorited={isFavorited}
          />
        </div>

        {/* Level badge */}
        <span className={cn(
          'absolute top-3 right-3 font-heading text-[0.65rem] font-bold backdrop-blur-sm px-2 py-0.5 rounded',
          LEVEL_COLORS[course.level],
        )}>
          {LEVEL_LABELS[course.level]}
        </span>

        {/* Price */}
        <span
          className={cn(
            'absolute bottom-3 right-3 font-heading text-[0.8rem] font-extrabold px-2.5 py-1 rounded',
            course.isFree
              ? 'bg-accent-emerald/20 text-accent-emerald'
              : 'bg-accent-cyan/20 text-accent-cyan',
          )}
        >
          {formatPrice(course.priceSingle)}
        </span>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-0/90 via-surface-0/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-end justify-center gap-2 pb-4">
          <span className="font-heading text-[0.75rem] font-semibold bg-accent-cyan text-brand-dark px-4 py-1.5 rounded-full">
            Inizia
          </span>
        </div>
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
          <span>⏱ {formatDuration(course.durationMin)}</span>
          <span className="flex items-center gap-1">
            <span className="text-accent-amber">★</span> {course.rating}
          </span>
        </div>
      </div>
    </div>
  );
}
