'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatPrice, formatDuration } from '@/lib/utils';
import { AREA_CONFIG, LEVEL_LABELS, LEVEL_COLORS } from '@/lib/area-config';
import { Badge } from '@/components/ui/Badge';
import { FavoriteButton } from '@/components/corso/FavoriteButton';
import { CourseCardVideoPreview } from '@/components/corso/CourseCardVideoPreview';
import type { CourseWithMeta } from '@/types';

interface CourseCardProps {
  course: CourseWithMeta;
  isFavorited?: boolean;
}

export function CourseCard({ course, isFavorited = false }: CourseCardProps) {
  const area = AREA_CONFIG[course.area];
  const href = `/catalogo-corsi/${course.slug}`;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative w-[175px] h-[260px] hover:w-[380px] hover:h-[340px] shrink-0 rounded-md overflow-hidden transition-[width,height] duration-300 ease-out hover:z-30 z-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {/* ── COVER — occupa tutta la card ── */}
      <div className="relative w-full h-full">

        {/* Immagine collapsed (portrait) o fallback emoji */}
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="400px"
          />
        ) : (
          <div className={cn('absolute inset-0 bg-gradient-to-br flex items-center justify-center', area.cardGradient)}>
            <span className="text-6xl opacity-70">{course.emoji}</span>
          </div>
        )}

        {/* Immagine expanded (landscape) — crossfade all'hover */}
        {course.thumbnailExpandedUrl && (
          <Image
            src={course.thumbnailExpandedUrl}
            alt=""
            fill
            className="object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100"
            sizes="400px"
            aria-hidden
          />
        )}

        {/* Video preview — appare dopo 1.5s di hover */}
        {course.previewPlaybackId && (
          <CourseCardVideoPreview
            playbackId={course.previewPlaybackId}
            isHovered={isHovered}
          />
        )}

        {/* Gradient hover — visibile solo in expanded */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-0 via-surface-0/70 to-surface-0/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* ── Overlay EXPANDED — tutto visibile solo all'hover ── */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end px-3 pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">

          {/* Top row: prezzo (sx) · area badge · level · favorite (dx) */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
            <span className={cn(
              'font-heading text-[0.78rem] font-extrabold',
              course.isFree ? 'text-accent-emerald' : 'text-accent-cyan',
            )}>
              {formatPrice(course.priceSingle)}
            </span>
            <div className="flex items-center gap-1.5">
              <Badge variant={area.badgeVariant} className="text-[0.58rem]">
                {area.label}
              </Badge>
              <span className={cn(
                'font-heading text-[0.62rem] font-bold backdrop-blur-sm px-2 py-0.5 rounded',
                LEVEL_COLORS[course.level],
              )}>
                {LEVEL_LABELS[course.level]}
              </span>
              <FavoriteButton courseId={course.id} initialFavorited={isFavorited} />
            </div>
          </div>

          {/* Titolo */}
          <h3 className="font-heading text-[0.84rem] font-bold text-text-primary leading-snug mb-2">
            {course.title}
          </h3>

          {/* Meta */}
          <div className="flex items-center gap-1.5 text-[0.65rem] text-text-muted mb-2 flex-wrap">
            <span>⏱ {formatDuration(course.durationMin)}</span>
            <span className="text-border-hover">·</span>
            <span>{course.lessonCount} lezioni</span>
            <span className="text-border-hover">·</span>
            <span className="flex items-center gap-0.5">
              <span className="text-accent-amber">★</span> {course.rating}
            </span>
          </div>

          {/* Moduli (max 3) */}
          {course.modules && course.modules.length > 0 && (
            <ul className="mb-3 space-y-0.5">
              {course.modules.slice(0, 3).map((mod) => (
                <li key={mod.id} className="flex items-start gap-1 text-[0.68rem] text-text-secondary">
                  <span className="text-accent-cyan shrink-0 font-bold mt-[1px]">›</span>
                  <span className="line-clamp-1">{mod.title}</span>
                </li>
              ))}
            </ul>
          )}

          {/* CTA */}
          <Link
            href={href}
            className="w-full text-center font-heading text-[0.72rem] font-semibold bg-accent-cyan text-brand-dark py-1.5 rounded-full hover:brightness-110 transition-all"
          >
            Scopri
          </Link>
        </div>
      </div>
    </div>
  );
}
