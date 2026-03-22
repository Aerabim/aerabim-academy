import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { EnrolledCourse } from '@/types';
import { AREA_CONFIG } from '@/lib/area-config';

interface ContinueStudyingProps {
  courses: EnrolledCourse[];
}

export function ContinueStudying({ courses }: ContinueStudyingProps) {
  if (courses.length === 0) {
    return (
      <Card>
        <div className="px-5 pt-5">
          <div className="font-heading text-[0.98rem] font-bold text-text-primary tracking-tight">
            Continua a Studiare
          </div>
          <div className="text-[0.72rem] text-text-muted mt-px">
            Riprendi da dove avevi lasciato
          </div>
        </div>
        <div className="px-5 pb-5 pt-4 text-center">
          <p className="text-text-muted text-[0.8rem] py-6">
            Nessun corso in corso.{' '}
            <Link href="/catalogo-corsi" className="text-accent-cyan hover:underline">
              Esplora il catalogo
            </Link>
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="px-5 pt-5 flex items-center justify-between">
        <div>
          <div className="font-heading text-[0.98rem] font-bold text-text-primary tracking-tight">
            Continua a Studiare
          </div>
          <div className="text-[0.72rem] text-text-muted mt-px">
            Riprendi da dove avevi lasciato
          </div>
        </div>
        <Link
          href="/i-miei-corsi"
          className="font-heading text-[0.76rem] text-accent-cyan font-semibold hover:text-[#5FE0D7] transition-colors"
        >
          Vedi tutti &rarr;
        </Link>
      </div>
      <div className="px-5 pb-5 pt-4 flex flex-col gap-2.5">
        {courses.slice(0, 3).map((course) => {
          const area = AREA_CONFIG[course.area];
          return (
            <Link
              key={course.courseId}
              href={`/learn/${course.courseId}`}
              className="flex items-center gap-3.5 p-3 bg-surface-2 rounded-md cursor-pointer border border-transparent hover:border-accent-cyan/[0.12] hover:bg-surface-3 hover:translate-x-[3px] transition-all"
            >
              <div className={`w-[52px] h-[52px] rounded-sm shrink-0 flex items-center justify-center text-xl bg-gradient-to-br ${area.cardGradient}`}>
                {course.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.84rem] font-semibold text-text-primary mb-0.5 truncate">
                  {course.title}
                </div>
                <div className="flex items-center gap-2 text-[0.7rem] text-text-muted">
                  <Badge variant={area.badgeVariant}>{area.label}</Badge>
                  <span>{course.currentModule}</span>
                </div>
                <ProgressBar percentage={course.progress} className="mt-[7px]" />
              </div>
              <div className="font-heading text-[0.74rem] font-bold text-accent-cyan shrink-0 min-w-[38px] text-right">
                {course.progress}%
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
