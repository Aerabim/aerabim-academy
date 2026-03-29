export const dynamic = 'force-dynamic';

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import {
  verifyEnrollment,
  getLessonPageData,
  getQuizQuestionsForLesson,
  getBestQuizAttempt,
} from '@/lib/learn/queries';
import { generatePlaybackTokens, type MuxPlaybackTokens } from '@/lib/mux/helpers';
import { VideoPlayer } from '@/components/corso/VideoPlayer';
import { LessonSidebar } from '@/components/corso/LessonSidebar';
import { LessonStepper } from '@/components/corso/LessonStepper';
import { LessonNavBar } from '@/components/corso/LessonNavBar';
import { QuizBlock } from '@/components/quiz/QuizBlock';
import { MarkLessonComplete } from '@/components/corso/MarkLessonComplete';

interface PageProps {
  params: { courseId: string; lessonId: string };
}

export default async function LessonPage({ params }: PageProps) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Verify enrollment server-side
  const isEnrolled = await verifyEnrollment(supabase, user.id, params.courseId);
  if (!isEnrolled) {
    const { data: courseRow } = await supabase
      .from('courses')
      .select('slug')
      .eq('id', params.courseId)
      .single() as { data: { slug: string } | null };

    redirect(courseRow ? `/catalogo-corsi/${courseRow.slug}` : '/catalogo-corsi');
  }

  // Fetch lesson data with navigation context
  const data = await getLessonPageData(supabase, params.courseId, params.lessonId, user.id);
  if (!data) notFound();

  const { lesson, moduleName, courseName, navigation, modules } = data;

  // Generate signed playback tokens server-side for signed Mux assets
  let playbackTokens: MuxPlaybackTokens | undefined;
  if (lesson.type === 'video' && lesson.muxPlaybackId) {
    try {
      playbackTokens = generatePlaybackTokens(lesson.muxPlaybackId);
    } catch (err) {
      console.error('[lesson] Failed to generate playback tokens:', err);
    }
  }

  // Fetch quiz data if lesson is a quiz
  let quizQuestions: Awaited<ReturnType<typeof getQuizQuestionsForLesson>> = [];
  let quizBestAttempt: Awaited<ReturnType<typeof getBestQuizAttempt>> = null;
  if (lesson.type === 'quiz') {
    [quizQuestions, quizBestAttempt] = await Promise.all([
      getQuizQuestionsForLesson(supabase, lesson.id),
      getBestQuizAttempt(supabase, user.id, lesson.id),
    ]);
  }

  return (
    <div className="w-full px-4 lg:px-6 py-5">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/learn/${params.courseId}`}
          className="inline-flex items-center gap-1.5 text-text-muted text-[0.78rem] hover:text-text-secondary transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L4.5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Torna al corso
        </Link>

        <span className="text-text-muted text-[0.72rem]">
          Lezione {navigation.currentIndex + 1} di {navigation.totalCount}
        </span>
      </div>

      {/* Two-column layout — main column sized to video max width, sidebar fills rest */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,calc(50vh*16/9))_minmax(300px,1fr)] gap-6">
        {/* Main content */}
        <main>
          {/* Video player or type-specific content */}
          {lesson.type === 'video' && lesson.muxPlaybackId ? (
            <VideoPlayer
              playbackId={lesson.muxPlaybackId}
              lessonId={lesson.id}
              courseId={params.courseId}
              initialWatchTimeSec={lesson.watchTimeSec}
              tokens={playbackTokens}
            />
          ) : lesson.type === 'video' ? (
            <div className="w-full aspect-video max-h-[50vh] bg-surface-1 border border-border-subtle rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl mb-2">🎬</div>
                <p className="text-text-muted text-sm">Video in fase di caricamento</p>
              </div>
            </div>
          ) : lesson.type === 'quiz' && quizQuestions.length > 0 ? (
            <QuizBlock
              lessonId={lesson.id}
              courseId={params.courseId}
              questions={quizQuestions}
              previousBestScore={quizBestAttempt?.score ?? null}
              previousPassed={quizBestAttempt?.passed ?? false}
            />
          ) : lesson.type === 'quiz' ? (
            <div className="w-full bg-surface-1 border border-border-subtle rounded-lg p-12 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl mb-2">📝</div>
                <p className="text-text-secondary text-sm font-heading font-semibold mb-1">Quiz</p>
                <p className="text-text-muted text-[0.78rem]">
                  Le domande per questo quiz non sono ancora disponibili.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full bg-surface-1 border border-border-subtle rounded-lg p-12 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl mb-2">📄</div>
                <p className="text-text-secondary text-sm font-heading font-semibold mb-1">Materiale didattico</p>
                <p className="text-text-muted text-[0.78rem]">
                  Il materiale sarà disponibile nella prossima versione.
                </p>
                <MarkLessonComplete
                  lessonId={lesson.id}
                  initialCompleted={lesson.completed}
                />
              </div>
            </div>
          )}

          {/* Module stepper */}
          <div className="mt-4">
            <LessonStepper
              courseId={params.courseId}
              currentLessonId={params.lessonId}
              moduleTitle={navigation.currentModule.title}
              moduleOrder={navigation.currentModule.orderNum}
              lessons={navigation.currentModule.lessons}
            />
          </div>

          {/* Lesson info */}
          <div className="mt-5">
            <h1 className="font-heading text-lg lg:text-xl font-extrabold text-text-primary mb-1">
              {lesson.title}
            </h1>
            <p className="text-text-muted text-[0.78rem]">
              {moduleName} · {courseName}
            </p>
          </div>

          {/* Navigation */}
          <LessonNavBar
            courseId={params.courseId}
            prevLesson={navigation.prevLesson}
            nextLesson={navigation.nextLesson}
            crossesModuleBoundary={navigation.crossesModuleBoundary}
            nextModuleName={navigation.nextModuleName}
          />
        </main>

        {/* Sidebar */}
        <div className="hidden lg:block self-start">
          <LessonSidebar
            courseId={params.courseId}
            currentLessonId={params.lessonId}
            modules={modules}
          />
        </div>
      </div>
    </div>
  );
}
