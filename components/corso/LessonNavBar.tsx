import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { LessonNavLink, LessonType } from '@/types';

interface LessonNavBarProps {
  courseId: string;
  prevLesson: LessonNavLink | null;
  nextLesson: LessonNavLink | null;
  crossesModuleBoundary: boolean;
  nextModuleName: string | null;
}

/* ── Lesson type icons (small) ── */

function NavTypeIcon({ type }: { type: LessonType }) {
  switch (type) {
    case 'video':
      return (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="shrink-0">
          <rect x="2" y="4" width="15" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M17 9.5l5-3v11l-5-3v-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'quiz':
      return (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="shrink-0">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      );
    case 'material':
      return (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="shrink-0">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case 'esercitazione':
      return (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="shrink-0">
          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
  }
}

const TYPE_LABELS: Record<LessonType, string> = {
  video: 'Video',
  quiz: 'Quiz',
  material: 'Materiale',
  esercitazione: 'Esercitazione',
};

const TYPE_COLORS: Record<LessonType, string> = {
  video: 'text-accent-cyan',
  quiz: 'text-accent-amber',
  material: 'text-violet-400',
  esercitazione: 'text-accent-emerald',
};

export function LessonNavBar({
  courseId,
  prevLesson,
  nextLesson,
  crossesModuleBoundary,
  nextModuleName,
}: LessonNavBarProps) {
  return (
    <div className="space-y-3 mt-6">
      {/* Module transition banner */}
      {crossesModuleBoundary && nextModuleName && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent-cyan/[0.06] border border-accent-cyan/15">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-emerald/15 shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-emerald">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading text-[0.78rem] font-semibold text-text-primary">
              Modulo completato!
            </p>
            <p className="text-[0.72rem] text-text-muted truncate">
              Prossimo: {nextModuleName}
            </p>
          </div>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-accent-cyan shrink-0">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Navigation cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Previous */}
        {prevLesson ? (
          <Link
            href={`/learn/${courseId}/${prevLesson.id}`}
            className="group flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border-subtle bg-surface-1/40 hover:bg-surface-1/80 hover:border-border-hover transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-text-muted group-hover:text-text-primary transition-colors">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex-1 min-w-0 text-right">
              <span className="text-[0.65rem] text-text-muted block">Precedente</span>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className={cn('shrink-0', TYPE_COLORS[prevLesson.type])}>
                  <NavTypeIcon type={prevLesson.type} />
                </span>
                <span className="font-heading text-[0.78rem] font-medium text-text-primary truncate group-hover:text-accent-cyan transition-colors">
                  {prevLesson.title}
                </span>
              </div>
              <span className="text-[0.62rem] text-text-muted">{prevLesson.moduleName}</span>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {/* Next */}
        {nextLesson ? (
          <Link
            href={`/learn/${courseId}/${nextLesson.id}`}
            className={cn(
              'group flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all',
              crossesModuleBoundary
                ? 'border-accent-cyan/25 bg-accent-cyan/[0.06] hover:bg-accent-cyan/[0.12] hover:border-accent-cyan/40'
                : 'border-border-subtle bg-surface-1/40 hover:bg-surface-1/80 hover:border-border-hover',
            )}
          >
            <div className="flex-1 min-w-0">
              <span className="text-[0.65rem] text-text-muted block">
                {crossesModuleBoundary ? 'Prossimo modulo' : 'Successiva'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn('shrink-0', TYPE_COLORS[nextLesson.type])}>
                  <NavTypeIcon type={nextLesson.type} />
                </span>
                <span className="font-heading text-[0.78rem] font-medium text-text-primary truncate group-hover:text-accent-cyan transition-colors">
                  {nextLesson.title}
                </span>
              </div>
              <span className="text-[0.62rem] text-text-muted">{nextLesson.moduleName}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-accent-cyan">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : (
          <Link
            href={`/learn/${courseId}`}
            className="group flex items-center gap-3 px-4 py-3.5 rounded-xl border border-accent-emerald/25 bg-accent-emerald/[0.06] hover:bg-accent-emerald/[0.12] hover:border-accent-emerald/40 transition-all"
          >
            <div className="flex-1 min-w-0">
              <span className="text-[0.65rem] text-text-muted block">Corso completato</span>
              <span className="font-heading text-[0.78rem] font-medium text-accent-emerald mt-0.5 block">
                Torna all&apos;overview
              </span>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-accent-emerald">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}
