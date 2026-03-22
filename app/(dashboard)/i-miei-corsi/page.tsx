import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AREA_CONFIG } from '@/lib/area-config';
import { createServerClient } from '@/lib/supabase/server';
import { computeCourseProgress } from '@/lib/learn/queries';
import type { AreaCode, EnrolledCourse } from '@/types';

export default async function IMieiCorsiPage() {
  let courses: EnrolledCourse[] = [];

  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Fetch real enrollments with course data
    const { data: rawEnrollments } = await supabase
      .from('enrollments')
      .select('course_id, expires_at, courses(id, slug, title, area)')
      .eq('user_id', user.id);

    interface EnrollmentWithCourse {
      course_id: string;
      expires_at: string | null;
      courses: { id: string; slug: string; title: string; area: AreaCode } | null;
    }

    const enrollments = (rawEnrollments ?? []) as unknown as EnrollmentWithCourse[];

    // Filter out expired enrollments
    const activeEnrollments = enrollments.filter(
      (e) => !e.expires_at || new Date(e.expires_at) > new Date(),
    );

    if (activeEnrollments.length > 0) {
      // Build enrolled courses with real progress
      const coursesWithProgress = await Promise.all(
        activeEnrollments
          .filter((e) => e.courses)
          .map(async (enrollment) => {
            const course = enrollment.courses!;

            const progress = await computeCourseProgress(supabase, course.id, user.id);
            const areaConfig = AREA_CONFIG[course.area];

            const enrolled: EnrolledCourse = {
              courseId: course.id,
              slug: course.slug,
              title: course.title,
              area: course.area,
              emoji: areaConfig?.emoji ?? '📚',
              currentModule: `${progress.completed}/${progress.total} lezioni`,
              progress: progress.percentage,
              isCompleted: progress.percentage === 100,
            };

            return enrolled;
          }),
      );

      courses = coursesWithProgress;
    }
  } catch {
    // DB not available — leave courses empty
    courses = [];
  }

  const inProgress = courses.filter((c) => !c.isCompleted);
  const completed = courses.filter((c) => c.isCompleted);

  return (
    <div className="w-full px-6 lg:px-9 py-7">
      {/* Header */}
      <h1 className="font-heading text-2xl font-bold text-text-primary">
        I Miei <span className="gradient-text-cyan">Corsi</span>
      </h1>
      <p className="mt-2 text-text-secondary text-sm">
        {inProgress.length} corsi in corso · {completed.length} completati
      </p>

      {/* Empty state */}
      {courses.length === 0 && (
        <div className="mt-10 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📚</span>
          </div>
          <p className="text-text-secondary text-sm max-w-sm mx-auto mb-4">
            Non hai ancora iniziato nessun corso. Esplora il catalogo per trovare il corso giusto per te!
          </p>
          <Link
            href="/catalogo-corsi"
            className="inline-block font-heading text-[0.8rem] font-semibold bg-accent-cyan text-brand-dark px-6 py-2.5 rounded-full hover:brightness-110 transition-all"
          >
            Esplora il catalogo
          </Link>
        </div>
      )}

      {/* Course list */}
      <div className="mt-6 space-y-2.5">
        {courses.map((course) => {
          const area = AREA_CONFIG[course.area];

          return (
            <Link key={course.courseId} href={`/learn/${course.courseId}`}>
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
