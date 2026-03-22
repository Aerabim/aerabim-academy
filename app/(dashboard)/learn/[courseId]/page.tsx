export const dynamic = 'force-dynamic';

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { verifyEnrollment, getCourseWithModulesAndProgress } from '@/lib/learn/queries';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LessonList } from '@/components/corso/LessonList';
import type { ModuleWithLessons, LessonDisplay } from '@/types';

interface PageProps {
  params: { courseId: string };
}

export default async function CourseLearnPage({ params }: PageProps) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Verify enrollment
  const isEnrolled = await verifyEnrollment(supabase, user.id, params.courseId);
  if (!isEnrolled) {
    // Try to find the course slug for redirect
    const { data: courseRow } = await supabase
      .from('courses')
      .select('slug')
      .eq('id', params.courseId)
      .single() as { data: { slug: string } | null };

    redirect(courseRow ? `/catalogo-corsi/${courseRow.slug}` : '/catalogo-corsi');
  }

  // Fetch course data with progress
  const overview = await getCourseWithModulesAndProgress(supabase, params.courseId, user.id);
  if (!overview) notFound();

  const { course, modules, totalLessons, completedLessons, firstIncompleteLessonId } = overview;
  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isCompleted = percentage === 100;

  // Convert ModuleWithLessonsAndProgress to ModuleWithLessons for LessonList
  const modulesForList: ModuleWithLessons[] = modules.map((mod) => ({
    id: mod.id,
    courseId: mod.courseId,
    title: mod.title,
    orderNum: mod.orderNum,
    lessons: mod.lessons.map((l): LessonDisplay => ({
      id: l.id,
      moduleId: l.moduleId,
      title: l.title,
      description: '',
      orderNum: l.orderNum,
      type: l.type,
      durationSec: l.durationSec,
      isPreview: l.isPreview,
      status: l.completed ? 'completed' : 'active',
    })),
  }));

  // Determine the target lesson for "Continua" button
  const targetLessonId = firstIncompleteLessonId ?? modules[0]?.lessons[0]?.id;

  return (
    <div className="w-full px-6 lg:px-9 py-7">
      {/* Back link */}
      <Link
        href="/i-miei-corsi"
        className="inline-flex items-center gap-1.5 text-text-muted text-[0.78rem] hover:text-text-secondary transition-colors mb-5"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 3L4.5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Torna ai miei corsi
      </Link>

      {/* Course header */}
      <div className="mb-8">
        <h1 className="font-heading text-xl lg:text-2xl font-extrabold text-text-primary mb-3">
          {course.title}
        </h1>

        {/* Progress bar */}
        <div className="flex items-center gap-4 mb-4">
          <ProgressBar
            percentage={percentage}
            color={isCompleted ? 'emerald' : 'cyan'}
            className="flex-1"
          />
          <span className={`font-heading text-[0.82rem] font-bold ${isCompleted ? 'text-accent-emerald' : 'text-accent-cyan'}`}>
            {isCompleted ? 'Completato' : `${percentage}%`}
          </span>
        </div>

        <p className="text-text-muted text-[0.78rem]">
          {completedLessons} di {totalLessons} lezioni completate
        </p>

        {/* Continue button */}
        {targetLessonId && (
          <Link
            href={`/learn/${params.courseId}/${targetLessonId}`}
            className="inline-flex items-center gap-2 mt-4 font-heading text-[0.82rem] font-bold bg-accent-cyan text-brand-dark px-5 py-2.5 rounded-md hover:brightness-110 transition-all"
          >
            {isCompleted ? 'Rivedi il corso' : 'Continua lezione'}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3L9.5 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
      </div>

      {/* Lesson list */}
      {modulesForList.length > 0 ? (
        <LessonList modules={modulesForList} courseId={params.courseId} />
      ) : (
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-8 text-center">
          <p className="text-text-muted text-sm">
            Le lezioni del corso saranno disponibili a breve.
          </p>
        </div>
      )}
    </div>
  );
}
