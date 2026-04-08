import Link from 'next/link';
import type { AdminTopCourse } from '@/types';

interface TopCoursesProps {
  courses: AdminTopCourse[];
}

export function TopCourses({ courses }: TopCoursesProps) {
  const max = courses[0]?.enrollmentCount ?? 1;

  return (
    <div className="bg-surface-1 border border-border-subtle rounded-lg overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between">
        <h2 className="text-[0.82rem] font-heading font-semibold text-text-primary">
          Top corsi per iscrizioni
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
          Nessun dato disponibile.
        </div>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {courses.map((course, i) => {
            const barWidth = max > 0 ? Math.round((course.enrollmentCount / max) * 100) : 0;
            return (
              <li key={course.id}>
                <Link
                  href={`/admin/corsi/${course.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/40 transition-colors group"
                >
                  <span className="shrink-0 w-5 text-[0.68rem] font-heading font-bold text-text-muted text-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[0.8rem] text-text-primary font-medium truncate group-hover:text-accent-cyan transition-colors">
                        {course.title}
                      </span>
                      <span className="shrink-0 text-[0.72rem] font-semibold text-text-secondary">
                        {course.enrollmentCount}
                      </span>
                    </div>
                    <div className="h-[3px] bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-cyan/50 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
