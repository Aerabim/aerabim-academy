'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ModuleWithLessons, LessonDisplay, LessonType } from '@/types';

interface LessonListProps {
  modules: ModuleWithLessons[];
  courseId?: string;
  currentLessonId?: string;
}

/* ── Lesson type icons ── */

function LessonTypeIcon({ type, className }: { type: LessonType; className?: string }) {
  const base = cn('shrink-0', className);

  switch (type) {
    case 'video':
      return (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className={base}>
          <rect x="2" y="4" width="15" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M17 9.5l5-3v11l-5-3v-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'quiz':
      return (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className={base}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      );
    case 'material':
      return (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className={base}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'esercitazione':
      return (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className={base}>
          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className={base}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
  }
}

const TYPE_COLORS: Record<LessonType, string> = {
  video: 'text-accent-cyan',
  quiz: 'text-accent-amber',
  material: 'text-violet-400',
  esercitazione: 'text-accent-emerald',
};

/* ── Helper ── */

function formatModuleDuration(lessons: LessonDisplay[]): string {
  const totalSec = lessons.reduce((sum, l) => sum + (l.durationSec ?? 0), 0);
  if (totalSec === 0) return '';
  const mins = Math.round(totalSec / 60);
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}min` : `${mins} min`;
}

/* ── Main component ── */

export function LessonList({ modules, courseId, currentLessonId }: LessonListProps) {
  // First module open by default, or the one containing the current lesson
  const defaultOpen = new Set<string>();
  if (currentLessonId) {
    const found = modules.find((m) => m.lessons.some((l) => l.id === currentLessonId));
    if (found) defaultOpen.add(found.id);
  } else if (modules.length > 0) {
    defaultOpen.add(modules[0].id);
  }

  const [openIds, setOpenIds] = useState<Set<string>>(defaultOpen);

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {modules.map((mod) => {
        const isOpen = openIds.has(mod.id);
        const duration = formatModuleDuration(mod.lessons);

        return (
          <div
            key={mod.id}
            className="rounded-xl border border-border-subtle bg-surface-1/60 backdrop-blur-sm overflow-hidden"
          >
            {/* Module header — accordion toggle */}
            <button
              onClick={() => toggle(mod.id)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left group hover:bg-surface-2/30 transition-colors"
            >
              {/* Module number badge */}
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-cyan/10 text-accent-cyan font-heading text-[0.75rem] font-bold shrink-0">
                {mod.orderNum}
              </span>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <span className="font-heading text-[0.7rem] uppercase tracking-wider text-text-muted">
                  Modulo {mod.orderNum}
                </span>
                <h3 className="font-heading text-[0.9rem] font-semibold text-text-primary truncate group-hover:text-accent-cyan transition-colors">
                  {mod.title}
                </h3>
              </div>

              {/* Meta */}
              <div className="hidden sm:flex items-center gap-3 shrink-0 text-[0.72rem] text-text-muted">
                <span>{mod.lessons.length} {mod.lessons.length === 1 ? 'lezione' : 'lezioni'}</span>
                {duration && (
                  <>
                    <span className="text-border-hover">·</span>
                    <span>{duration}</span>
                  </>
                )}
              </div>

              {/* Chevron */}
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                className={cn(
                  'shrink-0 text-text-muted transition-transform duration-200',
                  isOpen && 'rotate-180',
                )}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* Lessons — collapsible */}
            {isOpen && (
              <div className="px-5 pb-4">
                <div className="relative ml-4 pl-5 border-l border-border-subtle/60">
                  {mod.lessons.map((lesson, idx) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      moduleOrder={mod.orderNum}
                      courseId={courseId}
                      isCurrent={lesson.id === currentLessonId}
                      isLast={idx === mod.lessons.length - 1}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Lesson row ── */

function LessonRow({
  lesson,
  moduleOrder,
  courseId,
  isCurrent,
  isLast,
}: {
  lesson: LessonDisplay;
  moduleOrder: number;
  courseId?: string;
  isCurrent?: boolean;
  isLast?: boolean;
}) {
  const number = moduleOrder > 0 ? `${moduleOrder}.${lesson.orderNum}` : '--';
  const status = isCurrent ? 'active' : lesson.status;
  const typeColor = TYPE_COLORS[lesson.type] ?? 'text-text-muted';

  const row = (
    <div
      className={cn(
        'relative flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all',
        !isLast && 'mb-1',
        status === 'active' && 'bg-accent-cyan/[0.08] ring-1 ring-accent-cyan/20',
        status === 'completed' && 'opacity-60',
        status !== 'active' && 'hover:bg-surface-2/40',
      )}
    >
      {/* Timeline dot */}
      <span
        className={cn(
          'absolute -left-5 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-surface-1',
          status === 'active' && 'bg-accent-cyan',
          status === 'completed' && 'bg-accent-emerald',
          status === 'locked' && 'bg-surface-3',
          !['active', 'completed', 'locked'].includes(status) && 'bg-surface-3',
        )}
      />

      {/* Type icon */}
      <div className={cn('shrink-0', typeColor)}>
        <LessonTypeIcon type={lesson.type} />
      </div>

      {/* Number */}
      <span className="font-heading text-[0.7rem] font-bold text-text-muted w-7 shrink-0 text-center tabular-nums">
        {number}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'font-heading text-[0.82rem] font-medium leading-tight',
            status === 'completed' ? 'text-text-secondary line-through' : 'text-text-primary',
          )}
        >
          {lesson.title}
        </span>
        {lesson.description && (
          <p className="text-text-muted text-[0.7rem] truncate mt-0.5">{lesson.description}</p>
        )}
      </div>

      {/* Duration */}
      {lesson.durationSec !== null && lesson.durationSec > 0 && (
        <span className="text-text-muted text-[0.7rem] shrink-0 tabular-nums">
          {Math.round(lesson.durationSec / 60)} min
        </span>
      )}

      {/* Status icon */}
      <div className="shrink-0 w-5 h-5 flex items-center justify-center">
        {status === 'completed' && (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-emerald">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {status === 'active' && (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-cyan">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 5.5v5l4-2.5-4-2.5z" fill="currentColor" />
          </svg>
        )}
        {status === 'locked' && (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-muted/50">
            <rect x="4" y="7" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 7V5a2 2 0 014 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );

  if (courseId && !isCurrent) {
    return (
      <Link href={`/learn/${courseId}/${lesson.id}`}>
        {row}
      </Link>
    );
  }

  return row;
}
