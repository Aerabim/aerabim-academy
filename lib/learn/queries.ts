import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  Course,
  CourseLearnOverview,
  LessonPageData,
  LessonWithProgress,
  LessonType,
  ModuleWithLessonsAndProgress,
  QuizQuestionDisplay,
} from '@/types';

type SupabaseDb = SupabaseClient<Database>;

// ── Query result types (Supabase select inference doesn't work well with
//    the Database generic, so we define explicit shapes and cast) ──────

interface EnrollmentRow {
  id: string;
  expires_at: string | null;
}

interface ModuleRow {
  id: string;
  course_id: string;
  title: string;
  order_num: number;
}

interface LessonRow {
  id: string;
  module_id: string;
  title: string;
  order_num: number;
  type: LessonType;
  mux_playback_id: string | null;
  duration_sec: number | null;
  is_preview: boolean;
}

interface ProgressRow {
  lesson_id: string;
  completed: boolean;
  watch_time_sec: number;
}

/**
 * Verifies that the user has an active (non-expired) enrollment for the course.
 */
export async function verifyEnrollment(
  supabase: SupabaseDb,
  userId: string,
  courseId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('enrollments')
    .select('id, expires_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle() as { data: EnrollmentRow | null };

  if (!data) return false;
  return !data.expires_at || new Date(data.expires_at) > new Date();
}

/**
 * Fetches a course with its modules, lessons, and user progress.
 * Returns null if the course doesn't exist.
 */
export async function getCourseWithModulesAndProgress(
  supabase: SupabaseDb,
  courseId: string,
  userId: string,
): Promise<CourseLearnOverview | null> {
  // 1. Fetch the course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (courseError || !course) return null;

  // 2. Fetch modules
  const { data: rawModules, error: modulesError } = await supabase
    .from('modules')
    .select('id, course_id, title, order_num')
    .eq('course_id', courseId)
    .order('order_num', { ascending: true });

  if (modulesError || !rawModules) return null;
  const modulesData = rawModules as unknown as ModuleRow[];

  // 3. Fetch all lessons for these modules
  const moduleIds = modulesData.map((m) => m.id);
  const { data: rawLessons } = await supabase
    .from('lessons')
    .select('id, module_id, title, order_num, type, mux_playback_id, duration_sec, is_preview')
    .in('module_id', moduleIds.length > 0 ? moduleIds : ['__none__'])
    .order('order_num', { ascending: true });

  const lessonsData = (rawLessons ?? []) as unknown as LessonRow[];

  // 4. Fetch progress for these lessons
  const lessonIds = lessonsData.map((l) => l.id);
  const { data: rawProgress } = await supabase
    .from('progress')
    .select('lesson_id, completed, watch_time_sec')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['__none__']);

  const progressData = (rawProgress ?? []) as unknown as ProgressRow[];
  const progressMap = new Map(progressData.map((p) => [p.lesson_id, p]));

  // 5. Build modules with lessons and progress
  let totalLessons = 0;
  let completedLessons = 0;
  let firstIncompleteLessonId: string | null = null;

  const modules: ModuleWithLessonsAndProgress[] = modulesData.map((mod) => {
    const moduleLessons: LessonWithProgress[] = lessonsData
      .filter((l) => l.module_id === mod.id)
      .map((l) => {
        const progress = progressMap.get(l.id);
        const completed = progress?.completed ?? false;

        totalLessons++;
        if (completed) {
          completedLessons++;
        } else if (!firstIncompleteLessonId) {
          firstIncompleteLessonId = l.id;
        }

        return {
          id: l.id,
          moduleId: l.module_id,
          title: l.title,
          orderNum: l.order_num,
          type: l.type,
          muxPlaybackId: l.mux_playback_id,
          durationSec: l.duration_sec,
          isPreview: l.is_preview,
          completed,
          watchTimeSec: progress?.watch_time_sec ?? 0,
        };
      });

    return {
      id: mod.id,
      courseId: mod.course_id,
      title: mod.title,
      orderNum: mod.order_num,
      lessons: moduleLessons,
    };
  });

  return {
    course: course as Course,
    modules,
    totalLessons,
    completedLessons,
    firstIncompleteLessonId,
  };
}

/**
 * Fetches full lesson page data including navigation context.
 * Returns null if the lesson doesn't exist or doesn't belong to the course.
 */
export async function getLessonPageData(
  supabase: SupabaseDb,
  courseId: string,
  lessonId: string,
  userId: string,
): Promise<LessonPageData | null> {
  const overview = await getCourseWithModulesAndProgress(supabase, courseId, userId);
  if (!overview) return null;

  // Flatten all lessons in order
  const allLessons: { lesson: LessonWithProgress; moduleName: string }[] = [];
  for (const mod of overview.modules) {
    for (const lesson of mod.lessons) {
      allLessons.push({ lesson, moduleName: mod.title });
    }
  }

  // Find the current lesson
  const currentIndex = allLessons.findIndex((l) => l.lesson.id === lessonId);
  if (currentIndex === -1) return null;

  const current = allLessons[currentIndex];
  const prev = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const next = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return {
    lesson: current.lesson,
    moduleName: current.moduleName,
    courseName: overview.course.title,
    courseSlug: overview.course.slug,
    navigation: {
      prevLesson: prev ? { id: prev.lesson.id, title: prev.lesson.title } : null,
      nextLesson: next ? { id: next.lesson.id, title: next.lesson.title } : null,
      currentIndex,
      totalCount: allLessons.length,
    },
    modules: overview.modules,
  };
}

/**
 * Computes course progress for a user.
 * Returns { total, completed, percentage }.
 */
export async function computeCourseProgress(
  supabase: SupabaseDb,
  courseId: string,
  userId: string,
): Promise<{ total: number; completed: number; percentage: number }> {
  // Fetch all lesson IDs for the course
  const { data: rawModules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId);

  const moduleIds = ((rawModules ?? []) as unknown as { id: string }[]).map((m) => m.id);

  const { data: rawLessons } = await supabase
    .from('lessons')
    .select('id')
    .in('module_id', moduleIds.length > 0 ? moduleIds : ['__none__']);

  const lessonIds = ((rawLessons ?? []) as unknown as { id: string }[]).map((l) => l.id);
  const total = lessonIds.length;

  if (total === 0) return { total: 0, completed: 0, percentage: 0 };

  // Count completed
  const { data: rawProgress } = await supabase
    .from('progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('completed', true)
    .in('lesson_id', lessonIds);

  const completed = ((rawProgress ?? []) as unknown as { lesson_id: string }[]).length;
  const percentage = Math.round((completed / total) * 100);

  return { total, completed, percentage };
}

/**
 * Finds the course ID that a lesson belongs to.
 * Returns null if not found.
 */
export async function getCourseIdForLesson(
  supabase: SupabaseDb,
  lessonId: string,
): Promise<string | null> {
  const { data: lesson } = await supabase
    .from('lessons')
    .select('module_id')
    .eq('id', lessonId)
    .single() as { data: { module_id: string } | null };

  if (!lesson) return null;

  const { data: mod } = await supabase
    .from('modules')
    .select('course_id')
    .eq('id', lesson.module_id)
    .single() as { data: { course_id: string } | null };

  return mod?.course_id ?? null;
}

// ── Quiz Queries ─────────────────────────────────────

interface QuizQuestionRow {
  id: string;
  lesson_id: string;
  question: string;
  options: { text: string; is_correct: boolean }[];
  order_num: number | null;
}

/**
 * Fetches quiz questions for a lesson, stripping correct answers for client display.
 */
export async function getQuizQuestionsForLesson(
  supabase: SupabaseDb,
  lessonId: string,
): Promise<QuizQuestionDisplay[]> {
  const { data } = await supabase
    .from('quiz_questions')
    .select('id, lesson_id, question, options, order_num')
    .eq('lesson_id', lessonId)
    .order('order_num', { ascending: true });

  const rows = (data ?? []) as unknown as QuizQuestionRow[];

  return rows.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options.map((o) => o.text),
    orderNum: q.order_num,
  }));
}

/**
 * Fetches full quiz questions (with correct answers) for server-side grading.
 */
export async function getQuizQuestionsWithAnswers(
  supabase: SupabaseDb,
  lessonId: string,
): Promise<QuizQuestionRow[]> {
  const { data } = await supabase
    .from('quiz_questions')
    .select('id, lesson_id, question, options, order_num')
    .eq('lesson_id', lessonId)
    .order('order_num', { ascending: true });

  return (data ?? []) as unknown as QuizQuestionRow[];
}

/**
 * Checks if the user has passed the quiz for a given lesson.
 */
export async function hasPassedQuiz(
  supabase: SupabaseDb,
  userId: string,
  lessonId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('quiz_attempts')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('passed', true)
    .limit(1);

  return ((data ?? []) as unknown as { id: string }[]).length > 0;
}

/**
 * Gets the user's best quiz attempt for a lesson (if any).
 */
export async function getBestQuizAttempt(
  supabase: SupabaseDb,
  userId: string,
  lessonId: string,
): Promise<{ score: number; passed: boolean } | null> {
  const { data } = await supabase
    .from('quiz_attempts')
    .select('score, passed')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .order('score', { ascending: false })
    .limit(1);

  const rows = (data ?? []) as unknown as { score: number; passed: boolean }[];
  return rows.length > 0 ? rows[0] : null;
}

// ── Certificate Queries ──────────────────────────────

/**
 * Checks whether a user has completed all requirements for a course certificate:
 * - All lessons completed (progress)
 * - All quiz lessons passed (quiz_attempts)
 */
export async function checkCourseCompletionForCertificate(
  supabase: SupabaseDb,
  courseId: string,
  userId: string,
): Promise<{ eligible: boolean; reason?: string }> {
  // 1. Get all lessons
  const { data: rawModules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId);

  const moduleIds = ((rawModules ?? []) as unknown as { id: string }[]).map((m) => m.id);
  if (moduleIds.length === 0) return { eligible: false, reason: 'Nessun modulo trovato.' };

  const { data: rawLessons } = await supabase
    .from('lessons')
    .select('id, type')
    .in('module_id', moduleIds);

  const lessons = (rawLessons ?? []) as unknown as { id: string; type: string }[];
  if (lessons.length === 0) return { eligible: false, reason: 'Nessuna lezione trovata.' };

  // 2. Check all lessons completed
  const lessonIds = lessons.map((l) => l.id);
  const { data: completedProgress } = await supabase
    .from('progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('completed', true)
    .in('lesson_id', lessonIds);

  const completedCount = ((completedProgress ?? []) as unknown as { lesson_id: string }[]).length;
  if (completedCount < lessons.length) {
    return { eligible: false, reason: 'Non tutte le lezioni sono completate.' };
  }

  // 3. Check all quizzes passed
  const quizLessons = lessons.filter((l) => l.type === 'quiz');
  for (const quiz of quizLessons) {
    const passed = await hasPassedQuiz(supabase, userId, quiz.id);
    if (!passed) {
      return { eligible: false, reason: 'Non tutti i quiz sono stati superati.' };
    }
  }

  return { eligible: true };
}

/**
 * Checks if a certificate already exists for user+course.
 */
export async function getCertificateForCourse(
  supabase: SupabaseDb,
  userId: string,
  courseId: string,
): Promise<{ id: string; verify_code: string; issued_at: string } | null> {
  const { data } = await supabase
    .from('certificates')
    .select('id, verify_code, issued_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  return (data as { id: string; verify_code: string; issued_at: string } | null) ?? null;
}
