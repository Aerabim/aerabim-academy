import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LESSON_TYPE_CONFIG } from '@/lib/area-config';
import type { ModuleWithLessonsAndProgress, LessonWithProgress } from '@/types';

interface LessonSidebarProps {
  courseId: string;
  currentLessonId: string;
  modules: ModuleWithLessonsAndProgress[];
}

export function LessonSidebar({ courseId, currentLessonId, modules }: LessonSidebarProps) {
  const totalLessons = modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
  const completedLessons = modules.reduce(
    (sum, mod) => sum + mod.lessons.filter((l) => l.completed).length,
    0,
  );
  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isCompleted = percentage === 100;

  return (
    <aside className="bg-surface-1 border border-border-subtle rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading text-[0.78rem] font-bold text-text-primary">
            Contenuti del corso
          </h3>
          <span className="text-[0.68rem] font-heading font-semibold text-text-muted">
            {isCompleted ? 'Completato' : `${percentage}%`}
          </span>
        </div>
        <ProgressBar
          percentage={percentage}
          color={isCompleted ? 'emerald' : 'cyan'}
        />
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
        {modules.map((mod) => (
          <div key={mod.id}>
            {/* Module header */}
            <div className="px-4 py-2 bg-surface-0/50">
              <span className="font-heading text-[0.68rem] font-bold text-text-muted uppercase tracking-wider">
                {mod.title}
              </span>
            </div>

            {/* Lessons */}
            {mod.lessons.map((lesson) => (
              <SidebarLessonRow
                key={lesson.id}
                lesson={lesson}
                courseId={courseId}
                isCurrent={lesson.id === currentLessonId}
                moduleOrder={mod.orderNum}
              />
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}

function SidebarLessonRow({
  lesson,
  courseId,
  isCurrent,
  moduleOrder,
}: {
  lesson: LessonWithProgress;
  courseId: string;
  isCurrent: boolean;
  moduleOrder: number;
}) {
  const typeConfig = LESSON_TYPE_CONFIG[lesson.type];
  const number = moduleOrder > 0 ? `${moduleOrder}.${lesson.orderNum}` : `0.${lesson.orderNum}`;

  const content = (
    <div
      className={cn(
        'flex items-center gap-2.5 px-4 py-2.5 transition-colors text-[0.76rem]',
        isCurrent && 'bg-accent-cyan/[0.08] border-l-2 border-accent-cyan',
        !isCurrent && lesson.completed && 'opacity-60',
        !isCurrent && !lesson.completed && 'hover:bg-surface-2/50',
      )}
    >
      {/* Number */}
      <span className="font-heading text-[0.65rem] font-bold text-text-muted w-6 shrink-0 text-center">
        {number}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Badge variant={typeConfig.badgeVariant} className="text-[0.55rem] px-1 py-0">
            {typeConfig.label}
          </Badge>
          <span
            className={cn(
              'font-heading text-[0.74rem] font-semibold truncate',
              isCurrent ? 'text-accent-cyan' : 'text-text-primary',
              lesson.completed && !isCurrent && 'line-through',
            )}
          >
            {lesson.title}
          </span>
        </div>
      </div>

      {/* Status icon */}
      <div className="shrink-0 w-4 h-4 flex items-center justify-center">
        {lesson.completed && (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-accent-emerald">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {isCurrent && !lesson.completed && (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-accent-cyan">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 5.5v5l4-2.5-4-2.5z" fill="currentColor" />
          </svg>
        )}
      </div>
    </div>
  );

  // Current lesson: not clickable
  if (isCurrent) {
    return content;
  }

  return (
    <Link href={`/learn/${courseId}/${lesson.id}`}>
      {content}
    </Link>
  );
}
