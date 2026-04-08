import Link from 'next/link';
import { timeAgo } from '@/lib/utils';
import type { AdminDraftCourse } from '@/types';

interface DraftCoursesProps {
  courses: AdminDraftCourse[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:   { label: 'Bozza',    color: 'bg-surface-3 text-text-muted' },
  review:  { label: 'Revisione', color: 'bg-accent-amber/10 text-accent-amber' },
  default: { label: 'Bozza',    color: 'bg-surface-3 text-text-muted' },
};

export function DraftCourses({ courses }: DraftCoursesProps) {
  return (
    <div className="bg-surface-1 border border-border-subtle rounded-lg overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between">
        <h2 className="text-[0.82rem] font-heading font-semibold text-text-primary">
          Corsi non pubblicati
        </h2>
        <Link
          href="/admin/corsi"
          className="text-[0.72rem] text-text-muted hover:text-accent-cyan transition-colors"
        >
          Vedi tutti →
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="px-5 py-5 text-center text-[0.78rem] text-text-muted">
          Nessun corso in bozza.
        </div>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {courses.map((course) => {
            const statusStyle = STATUS_LABELS[course.status] ?? STATUS_LABELS.default;
            return (
              <li key={course.id}>
                <Link
                  href={`/admin/corsi/${course.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/40 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-amber/50 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.8rem] text-text-primary font-medium truncate">
                      {course.title}
                    </div>
                    <div className="text-[0.68rem] text-text-muted mt-0.5">
                      Modificato {timeAgo(course.updatedAt)}
                    </div>
                  </div>
                  <span className={`shrink-0 text-[0.6rem] font-semibold px-1.5 py-[2px] rounded-full ${statusStyle.color}`}>
                    {statusStyle.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
