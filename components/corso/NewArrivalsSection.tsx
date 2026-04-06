'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { AREA_CONFIG } from '@/lib/area-config';
import type { CourseWithMeta } from '@/types';

const DAYS_THRESHOLD = 90;
const MAX_CARDS = 6;

interface NewArrivalsSectionProps {
  courses: CourseWithMeta[];
}

export function NewArrivalsSection({ courses }: NewArrivalsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS_THRESHOLD);

  const newCourses = [...courses]
    .filter((c) => new Date(c.createdAt) >= cutoff)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_CARDS);

  if (newCourses.length < 2) return null;

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  function scroll(direction: 'left' | 'right') {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -189 : 189, behavior: 'smooth' });
  }

  return (
    <section className="group/new">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-accent-emerald/15 border border-accent-emerald/30 text-accent-emerald text-[0.65rem] font-black px-2 py-0.5 rounded font-heading tracking-wider">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-emerald" />
            </span>
            NUOVO
          </span>
          <h2 className="font-heading text-[1.15rem] font-bold text-text-primary">
            Appena arrivati in catalogo
          </h2>
        </div>
        <span className="text-[0.75rem] text-text-muted ml-auto">
          {newCourses.length} {newCourses.length === 1 ? 'corso' : 'corsi'} negli ultimi {DAYS_THRESHOLD} giorni
        </span>
      </div>

      {/* Scroll wrapper */}
      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-[130px] -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-surface-2/90 backdrop-blur-sm border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-all opacity-0 group-hover/new:opacity-100 flex items-center justify-center"
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
          className="flex gap-3.5 overflow-x-auto pb-4 scroll-smooth"
          style={{ scrollbarWidth: 'none' }}
        >
          {newCourses.map((course) => (
            <NewArrivalCard key={course.id} course={course} />
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-[130px] -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-surface-2/90 backdrop-blur-sm border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-all opacity-0 group-hover/new:opacity-100 flex items-center justify-center"
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

// ── Single new-arrival card ─────────────────────────────────────────────────

interface NewArrivalCardProps {
  course: CourseWithMeta;
}

function NewArrivalCard({ course }: NewArrivalCardProps) {
  const area = AREA_CONFIG[course.area];
  const href = `/catalogo-corsi/${course.slug}`;
  const [hovered, setHovered] = useState(false);

  const daysAgo = Math.floor(
    (Date.now() - new Date(course.createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  const ageLabel = daysAgo === 0 ? 'Oggi' : daysAgo === 1 ? 'Ieri' : `${daysAgo} giorni fa`;

  return (
    <Link
      href={href}
      className="group/card relative flex-shrink-0 w-[175px] h-[260px] rounded-md overflow-hidden block"
      style={{ transform: hovered ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.25s ease' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

      {/* "NUOVO" badge — top left */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-accent-emerald/90 backdrop-blur-sm text-brand-dark text-[0.58rem] font-black px-1.5 py-0.5 rounded font-heading tracking-wider">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-dark opacity-50" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-dark" />
        </span>
        NUOVO
      </div>

      {/* Area badge — top right */}
      <div className="absolute top-2 right-2 z-10">
        <span className="text-[0.58rem] font-bold px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm text-white">
          {area.label}
        </span>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 pt-6 z-10">
        <p className="text-white/50 text-[0.6rem] mb-0.5">{ageLabel}</p>
        <h3 className="font-heading text-[0.78rem] font-bold text-white leading-snug line-clamp-2 mb-1.5">
          {course.title}
        </h3>
        <span className={cn(
          'font-heading text-[0.72rem] font-extrabold',
          course.isFree ? 'text-accent-emerald' : 'text-accent-cyan',
        )}>
          {formatPrice(course.priceSingle)}
        </span>
      </div>

      {/* Hover CTA */}
      <div
        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-200"
        style={{ opacity: hovered ? 1 : 0 }}
      >
        <span className="bg-accent-cyan text-brand-dark text-[0.7rem] font-bold font-heading px-3 py-1.5 rounded-full shadow-lg">
          Scopri il corso
        </span>
      </div>
    </Link>
  );
}
