'use client';

import { useRef } from 'react';
import { CourseCard } from '@/components/corso/CourseCard';
import type { CourseWithMeta } from '@/types';

interface CourseRowProps {
  title: string;
  count: number;
  courses: CourseWithMeta[];
  favoriteIds?: Set<string>;
}

export function CourseRow({ title, count, courses, favoriteIds }: CourseRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: 'left' | 'right') {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -196 : 196;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  }

  return (
    <section className="group/row">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-[1.15rem] font-bold text-text-primary">
          {title}
        </h2>
        <span className="text-[0.75rem] text-text-muted">
          {count} {count === 1 ? 'corso' : 'corsi'}
        </span>
      </div>

      {/* Scroll container — pb/mb trick per permettere la fascia espansa verticalmente */}
      <div className="relative">
        {/* Left arrow — z-40 sopra le card in hover (z-30) */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-[135px] -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-surface-2/90 backdrop-blur-sm border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-all opacity-0 group-hover/row:opacity-100 flex items-center justify-center"
          aria-label="Scorri a sinistra"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Cards scroller */}
        <div
          ref={scrollRef}
          className="flex gap-3.5 overflow-x-auto pb-4 scroll-smooth"
          style={{ scrollbarWidth: 'none' }}
        >
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} isFavorited={favoriteIds?.has(course.id)} />
          ))}
        </div>

        {/* Right arrow — z-40 */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-[135px] -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-surface-2/90 backdrop-blur-sm border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-all opacity-0 group-hover/row:opacity-100 flex items-center justify-center"
          aria-label="Scorri a destra"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
