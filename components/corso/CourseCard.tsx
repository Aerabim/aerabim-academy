'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatPrice, formatDuration } from '@/lib/utils';
import { AREA_CONFIG, LEVEL_LABELS } from '@/lib/area-config';
import { Badge } from '@/components/ui/Badge';
import type { CourseWithMeta } from '@/types';

interface CourseCardProps {
  course: CourseWithMeta;
}

export function CourseCard({ course }: CourseCardProps) {
  const area = AREA_CONFIG[course.area];

  return (
    <Link
      href={`/catalogo-corsi/${course.slug}`}
      className="group w-[280px] shrink-0 rounded-md overflow-hidden transition-transform duration-300 hover:scale-[1.06] hover:z-20"
    >
      {/* Cover */}
      <div
        className={cn(
          'relative h-[160px] bg-gradient-to-br flex items-center justify-center',
          area.cardGradient,
        )}
      >
        <span className="text-5xl opacity-80">{course.emoji}</span>

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

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-0/90 via-surface-0/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center gap-2 pb-4">
          <span className="font-heading text-[0.75rem] font-semibold bg-accent-cyan text-brand-dark px-4 py-1.5 rounded-full">
            Inizia
          </span>
          <span className="font-heading text-[0.75rem] font-semibold bg-surface-3/80 backdrop-blur-sm text-text-primary px-3 py-1.5 rounded-full border border-border-hover">
            + Lista
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
    </Link>
  );
}
