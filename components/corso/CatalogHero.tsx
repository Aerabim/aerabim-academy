import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { AREA_CONFIG, LEVEL_LABELS } from '@/lib/area-config';
import { formatDuration } from '@/lib/utils';
import type { CourseWithMeta } from '@/types';

interface CatalogHeroProps {
  course: CourseWithMeta;
}

export function CatalogHero({ course }: CatalogHeroProps) {
  const area = AREA_CONFIG[course.area];

  return (
    <div className="relative min-h-[380px] lg:min-h-[420px] rounded-lg overflow-hidden bg-gradient-to-br from-surface-2 via-brand-blue/20 to-surface-1">
      {/* Decorative geometry */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute -top-20 -right-20 w-[400px] h-[400px] opacity-[0.04] text-accent-cyan" viewBox="0 0 400 400" fill="none">
          <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="1" />
          <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="0.5" />
          <line x1="0" y1="200" x2="400" y2="200" stroke="currentColor" strokeWidth="0.5" />
          <line x1="200" y1="0" x2="200" y2="400" stroke="currentColor" strokeWidth="0.5" />
        </svg>
        <span className="absolute top-12 right-16 text-[6rem] opacity-[0.06]">{course.emoji}</span>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-surface-0/90 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative flex flex-col justify-end h-full min-h-[380px] lg:min-h-[420px] p-8 lg:p-11 max-w-[560px]">
        {/* Popular badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-pulseRing absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan" />
          </span>
          <span className="font-heading text-[0.7rem] font-semibold text-accent-cyan uppercase tracking-wider">
            {course.isFeatured ? 'In evidenza' : 'Corso più popolare'}
          </span>
        </div>

        <h2 className="font-heading text-2xl lg:text-[2.2rem] font-extrabold text-text-primary leading-tight mb-3">
          {course.title}
        </h2>

        <p className="text-text-secondary text-sm leading-relaxed mb-5 line-clamp-2">
          {course.description}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-[0.72rem] text-text-muted mb-6">
          <Badge variant={area.badgeVariant}>{area.label}</Badge>
          <span>{LEVEL_LABELS[course.level]}</span>
          <span className="text-border-hover">·</span>
          <span>⏱ {formatDuration(course.durationMin)}</span>
          <span className="text-border-hover">·</span>
          <span className="flex items-center gap-0.5">
            <span className="text-accent-amber">★</span> {course.rating}
          </span>
          <span className="text-border-hover">·</span>
          <span>{course.enrolledCount} iscritti</span>
        </div>

        {/* CTA buttons */}
        <div className="flex items-center gap-3">
          <Link
            href={`/catalogo-corsi/${course.slug}`}
            className="font-heading text-[0.8rem] font-semibold bg-accent-cyan text-brand-dark px-6 py-2.5 rounded-full hover:brightness-110 transition-all"
          >
            Inizia il Corso
          </Link>
          <Link
            href={`/catalogo-corsi/${course.slug}`}
            className="font-heading text-[0.8rem] font-semibold bg-transparent text-text-primary px-5 py-2.5 rounded-full border border-border-hover hover:bg-surface-3 transition-all"
          >
            Scopri di più
          </Link>
        </div>
      </div>
    </div>
  );
}
