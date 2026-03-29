import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { LessonType } from '@/types';

interface StepLesson {
  id: string;
  title: string;
  type: LessonType;
  completed: boolean;
}

interface LessonStepperProps {
  courseId: string;
  currentLessonId: string;
  moduleTitle: string;
  moduleOrder: number;
  lessons: StepLesson[];
}

const TYPE_ICONS: Record<LessonType, string> = {
  video: 'V',
  quiz: 'Q',
  material: 'M',
  esercitazione: 'E',
};

export function LessonStepper({
  courseId,
  currentLessonId,
  moduleTitle,
  moduleOrder,
  lessons,
}: LessonStepperProps) {
  const currentIdx = lessons.findIndex((l) => l.id === currentLessonId);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-surface-1/60 backdrop-blur-sm border border-border-subtle rounded-xl">
      {/* Module label */}
      <div className="hidden sm:flex items-center gap-2 shrink-0 pr-3 border-r border-border-subtle/60">
        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-accent-cyan/10 text-accent-cyan font-heading text-[0.65rem] font-bold">
          {moduleOrder}
        </span>
        <span className="font-heading text-[0.72rem] font-medium text-text-secondary max-w-[140px] truncate">
          {moduleTitle}
        </span>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto scrollbar-none">
        {lessons.map((lesson, idx) => {
          const isCurrent = lesson.id === currentLessonId;
          const isPast = lesson.completed;
          const isFuture = !isCurrent && !isPast;

          const dot = (
            <div
              className="group relative flex items-center"
              key={lesson.id}
            >
              {/* Connector line */}
              {idx > 0 && (
                <div
                  className={cn(
                    'w-3 sm:w-5 h-[2px] shrink-0',
                    idx <= currentIdx && lessons[idx - 1].completed
                      ? 'bg-accent-emerald/40'
                      : idx <= currentIdx
                        ? 'bg-accent-cyan/30'
                        : 'bg-border-subtle/40',
                  )}
                />
              )}

              {/* Step dot */}
              <div
                className={cn(
                  'relative flex items-center justify-center shrink-0 transition-all',
                  isCurrent
                    ? 'w-8 h-8 rounded-lg bg-accent-cyan/15 ring-2 ring-accent-cyan/40'
                    : 'w-6 h-6 rounded-md',
                  isPast && !isCurrent && 'bg-accent-emerald/15',
                  isFuture && 'bg-surface-2/60',
                )}
              >
                {isPast && !isCurrent ? (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-accent-emerald">
                    <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span
                    className={cn(
                      'font-heading text-[0.58rem] font-bold',
                      isCurrent ? 'text-accent-cyan' : 'text-text-muted',
                    )}
                  >
                    {TYPE_ICONS[lesson.type]}
                  </span>
                )}
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-surface-0 border border-border-subtle rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <p className="text-[0.68rem] font-heading font-semibold text-text-primary">
                  {moduleOrder}.{idx + 1} {lesson.title}
                </p>
                <p className="text-[0.6rem] text-text-muted">
                  {isPast ? 'Completata' : isCurrent ? 'In corso' : 'Da fare'}
                </p>
              </div>
            </div>
          );

          if (!isCurrent) {
            return (
              <Link key={lesson.id} href={`/learn/${courseId}/${lesson.id}`} className="flex items-center">
                {idx > 0 && (
                  <div
                    className={cn(
                      'w-3 sm:w-5 h-[2px] shrink-0',
                      idx <= currentIdx && lessons[idx - 1].completed
                        ? 'bg-accent-emerald/40'
                        : idx <= currentIdx
                          ? 'bg-accent-cyan/30'
                          : 'bg-border-subtle/40',
                    )}
                  />
                )}
                <div
                  className={cn(
                    'group relative flex items-center justify-center shrink-0 transition-all hover:scale-110',
                    'w-6 h-6 rounded-md cursor-pointer',
                    isPast && 'bg-accent-emerald/15 hover:bg-accent-emerald/25',
                    isFuture && 'bg-surface-2/60 hover:bg-surface-2',
                  )}
                >
                  {isPast ? (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-accent-emerald">
                      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span className="font-heading text-[0.58rem] font-bold text-text-muted">
                      {TYPE_ICONS[lesson.type]}
                    </span>
                  )}
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-surface-0 border border-border-subtle rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    <p className="text-[0.68rem] font-heading font-semibold text-text-primary">
                      {moduleOrder}.{idx + 1} {lesson.title}
                    </p>
                    <p className="text-[0.6rem] text-text-muted">
                      {isPast ? 'Completata' : 'Da fare'}
                    </p>
                  </div>
                </div>
              </Link>
            );
          }

          return dot;
        })}
      </div>

      {/* Counter */}
      <span className="shrink-0 text-[0.7rem] text-text-muted font-heading tabular-nums">
        {currentIdx + 1}/{lessons.length}
      </span>
    </div>
  );
}
