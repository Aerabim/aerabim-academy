'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { AREA_CONFIG } from '@/lib/area-config';
import type { CourseWithMeta } from '@/types';

interface TopTenSectionProps {
  courses: CourseWithMeta[];
}

export function TopTenSection({ courses }: TopTenSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const top10 = [...courses]
    .sort((a, b) => b.enrolledCount - a.enrolledCount)
    .slice(0, 10);

  if (top10.length < 3) return null;

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  function scroll(direction: 'left' | 'right') {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -230 : 230, behavior: 'smooth' });
  }

  return (
    <section className="group/top10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-accent-amber text-brand-dark text-[0.65rem] font-black px-2 py-0.5 rounded font-heading tracking-wider">
            TOP 10
          </span>
          <h2 className="font-heading text-[1.15rem] font-bold text-text-primary">
            I più acquistati in Italia oggi
          </h2>
        </div>
      </div>

      {/* Scroll wrapper */}
      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-[130px] -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-surface-2/90 backdrop-blur-sm border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-all opacity-0 group-hover/top10:opacity-100 flex items-center justify-center"
            aria-label="Scorri a sinistra"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {/* Cards scroller */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          onMouseEnter={checkScroll}
          className="flex overflow-x-auto pb-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', gap: 0 }}
        >
          {top10.map((course, i) => (
            <TopTenCard key={course.id} course={course} rank={i + 1} />
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-[130px] -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-surface-2/90 backdrop-blur-sm border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-all opacity-0 group-hover/top10:opacity-100 flex items-center justify-center"
            aria-label="Scorri a destra"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}

// ── Single ranked card ──────────────────────────────────────────────────────

interface TopTenCardProps {
  course: CourseWithMeta;
  rank: number;
}

function TopTenCard({ course, rank }: TopTenCardProps) {
  const area = AREA_CONFIG[course.area];
  const href = `/catalogo-corsi/${course.slug}`;
  const [hovered, setHovered] = useState(false);

  // Font size for rank number: slightly smaller for double digits
  const rankFontSize = rank >= 10 ? '7rem' : '8.5rem';

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: 220, height: 260 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Rank number — outlined, z-10, anchored bottom-left */}
      <span
        className="absolute bottom-0 left-0 z-10 font-black select-none pointer-events-none"
        style={{
          fontSize: rankFontSize,
          WebkitTextStroke: '2.5px #304057',
          color: 'transparent',
          fontFamily: 'var(--font-heading, sans-serif)',
          lineHeight: 1,
        }}
        aria-hidden
      >
        {rank}
      </span>

      {/* Card — z-20, anchored top-right, overlaps the right side of the number */}
      <Link
        href={href}
        className="absolute top-0 right-0 w-[175px] h-[260px] rounded-md overflow-hidden z-20 block"
        style={{ transform: hovered ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.25s ease' }}
      >
        {/* Thumbnail */}
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover"
            sizes="175px"
          />
        ) : (
          <div className={cn('absolute inset-0 bg-gradient-to-br flex items-center justify-center', area.cardGradient)}>
            <span className="text-5xl opacity-70">{course.emoji}</span>
          </div>
        )}

        {/* Gradient overlay — always visible at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

        {/* Area badge — top right */}
        <div className="absolute top-2 right-2 z-10">
          <span className="text-[0.58rem] font-bold px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm text-white">
            {area.label}
          </span>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 pt-6 z-10">
          <h3 className="font-heading text-[0.78rem] font-bold text-white leading-snug line-clamp-2 mb-1.5">
            {course.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className={cn(
              'font-heading text-[0.72rem] font-extrabold',
              course.isFree ? 'text-accent-emerald' : 'text-accent-cyan',
            )}>
              {formatPrice(course.priceSingle)}
            </span>
            {course.enrolledCount > 0 && (
              <span className="text-[0.62rem] text-white/60">
                {course.enrolledCount} iscritti
              </span>
            )}
          </div>
        </div>

        {/* Hover overlay — "Scopri" CTA */}
        <div
          className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-200"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <span className="bg-accent-cyan text-brand-dark text-[0.7rem] font-bold font-heading px-3 py-1.5 rounded-full shadow-lg">
            Scopri il corso
          </span>
        </div>
      </Link>
    </div>
  );
}
