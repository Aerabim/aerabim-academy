import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { LESSON_TYPE_CONFIG } from '@/lib/area-config';
import type { ModuleWithLessons, LessonDisplay } from '@/types';

interface LessonListProps {
  modules: ModuleWithLessons[];
  courseId?: string;
  currentLessonId?: string;
}

export function LessonList({ modules, courseId, currentLessonId }: LessonListProps) {
  return (
    <div className="space-y-6">
      {modules.map((mod) => (
        <div key={mod.id}>
          {/* Module header */}
          <h3 className="font-heading text-[0.9rem] font-bold text-text-primary mb-3">
            {mod.title}
          </h3>

          {/* Lessons */}
          <div className="space-y-1">
            {mod.lessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                moduleOrder={mod.orderNum}
                courseId={courseId}
                isCurrent={lesson.id === currentLessonId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LessonRow({
  lesson,
  moduleOrder,
  courseId,
  isCurrent,
}: {
  lesson: LessonDisplay;
  moduleOrder: number;
  courseId?: string;
  isCurrent?: boolean;
}) {
  const typeConfig = LESSON_TYPE_CONFIG[lesson.type];
  const number = moduleOrder > 0 ? `${moduleOrder}.${lesson.orderNum}` : '--';

  const status = isCurrent ? 'active' : lesson.status;

  const row = (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-md transition-colors',
        status === 'active' && 'bg-accent-cyan/[0.06] border border-accent-cyan/20',
        status === 'completed' && 'opacity-60',
        status === 'locked' && 'opacity-75',
        status !== 'active' && 'border border-transparent hover:bg-surface-2/50',
      )}
    >
      {/* Lesson number */}
      <span className="font-heading text-[0.72rem] font-bold text-text-muted w-7 shrink-0 text-center">
        {number}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Badge variant={typeConfig.badgeVariant}>{typeConfig.label}</Badge>
          <span
            className={cn(
              'font-heading text-[0.84rem] font-semibold truncate',
              status === 'completed' ? 'text-text-secondary line-through' : 'text-text-primary',
            )}
          >
            {lesson.title}
          </span>
        </div>
        {lesson.description && (
          <p className="text-text-muted text-[0.72rem] truncate">{lesson.description}</p>
        )}
      </div>

      {/* Duration */}
      {lesson.durationSec && (
        <span className="text-text-muted text-[0.72rem] shrink-0">
          {Math.round(lesson.durationSec / 60)}min
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
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-muted">
            <rect x="4" y="7" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 7V5a2 2 0 014 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );

  // If courseId provided and not current lesson, wrap in Link
  if (courseId && !isCurrent) {
    return (
      <Link href={`/learn/${courseId}/${lesson.id}`}>
        {row}
      </Link>
    );
  }

  return row;
}
