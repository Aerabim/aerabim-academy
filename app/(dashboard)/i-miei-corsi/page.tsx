import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AREA_CONFIG } from '@/lib/area-config';
import { PLACEHOLDER_ENROLLED } from '@/lib/placeholder-data';

export default function IMieiCorsiPage() {
  const inProgress = PLACEHOLDER_ENROLLED.filter((c) => !c.isCompleted);
  const completed = PLACEHOLDER_ENROLLED.filter((c) => c.isCompleted);

  return (
    <div className="w-full px-6 lg:px-9 py-7">
      {/* Header */}
      <h1 className="font-heading text-2xl font-bold text-text-primary">
        I Miei <span className="gradient-text-cyan">Corsi</span>
      </h1>
      <p className="mt-2 text-text-secondary text-sm">
        {inProgress.length} corsi in corso · {completed.length} completati
      </p>

      {/* Course list */}
      <div className="mt-6 space-y-2.5">
        {PLACEHOLDER_ENROLLED.map((course) => {
          const area = AREA_CONFIG[course.area];

          return (
            <Link key={course.courseId} href={`/catalogo-corsi/${course.slug}`}>
              <Card
                className={cn(
                  'flex items-center gap-4 p-4 hover:translate-x-[3px] transition-all cursor-pointer',
                  course.isCompleted && 'opacity-50',
                )}
              >
                {/* Thumbnail */}
                <div
                  className={cn(
                    'w-[52px] h-[52px] rounded-lg shrink-0 flex items-center justify-center bg-gradient-to-br',
                    course.isCompleted
                      ? 'from-accent-emerald/20 to-accent-emerald/5'
                      : area.cardGradient,
                  )}
                >
                  <span className="text-xl">{course.emoji}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-[0.88rem] font-semibold text-text-primary truncate">
                    {course.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={area.badgeVariant}>{area.label}</Badge>
                    <span className="text-text-muted text-[0.68rem]">{course.currentModule}</span>
                  </div>
                  <ProgressBar
                    percentage={course.progress}
                    color={course.isCompleted ? 'emerald' : 'cyan'}
                    className="mt-2"
                  />
                </div>

                {/* Percentage */}
                <div className="shrink-0 text-right">
                  {course.isCompleted ? (
                    <span className="font-heading text-[0.74rem] font-bold text-accent-emerald">
                      Completato
                    </span>
                  ) : (
                    <span className="font-heading text-[0.74rem] font-bold text-accent-cyan">
                      {course.progress}%
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
