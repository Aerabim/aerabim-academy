import { AREA_CONFIG } from '@/lib/area-config';
import { createServerClient } from '@/lib/supabase/server';
import { computeCourseProgress } from '@/lib/learn/queries';
import type { AreaCode, EnrolledCourse } from '@/types';

type TypedClient = ReturnType<typeof createServerClient>;

// ── Row types ───────────────────────────────────────

interface ProgressRow {
  watch_time_sec: number;
}

interface QuizAttemptRow {
  score: number | null;
  passed: boolean | null;
}

interface ProgressActivityRow {
  watch_time_sec: number;
  completed_at: string | null;
}

// ── Dashboard Stats ─────────────────────────────────

interface DashboardStats {
  activeCourses: number;
  totalCourses: number;
  studyHours: number;
  quizzesPassed: number;
  avgScore: number;
  certificates: number;
}

export async function getDashboardStats(
  supabase: TypedClient,
  userId: string,
): Promise<DashboardStats> {
  const [enrollmentsRes, totalCoursesRes, progressRes, quizRes, certsRes] = await Promise.all([
    supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true),
    supabase
      .from('progress')
      .select('watch_time_sec')
      .eq('user_id', userId),
    supabase
      .from('quiz_attempts')
      .select('score, passed')
      .eq('user_id', userId)
      .eq('passed', true),
    supabase
      .from('certificates')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  const progressRows = (progressRes.data ?? []) as unknown as ProgressRow[];
  const totalWatchSec = progressRows.reduce(
    (sum, p) => sum + (p.watch_time_sec ?? 0),
    0,
  );

  const quizzes = (quizRes.data ?? []) as unknown as QuizAttemptRow[];
  const avgScore =
    quizzes.length > 0
      ? Math.round(quizzes.reduce((sum, q) => sum + (q.score ?? 0), 0) / quizzes.length)
      : 0;

  return {
    activeCourses: enrollmentsRes.count ?? 0,
    totalCourses: totalCoursesRes.count ?? 0,
    studyHours: Math.round(totalWatchSec / 3600),
    quizzesPassed: quizzes.length,
    avgScore,
    certificates: certsRes.count ?? 0,
  };
}

// ── Continue Studying (in-progress courses) ─────────

interface EnrollmentWithCourse {
  course_id: string;
  courses: { id: string; slug: string; title: string; area: AreaCode } | null;
}

export async function getContinueStudyingCourses(
  supabase: TypedClient,
  userId: string,
): Promise<EnrolledCourse[]> {
  const { data: rawEnrollments } = await supabase
    .from('enrollments')
    .select('course_id, courses(id, slug, title, area)')
    .eq('user_id', userId);

  const enrollments = (rawEnrollments ?? []) as unknown as EnrollmentWithCourse[];

  if (enrollments.length === 0) return [];

  const courses = await Promise.all(
    enrollments
      .filter((e) => e.courses)
      .map(async (enrollment) => {
        const course = enrollment.courses!;
        const progress = await computeCourseProgress(supabase, course.id, userId);
        const areaConfig = AREA_CONFIG[course.area];

        return {
          courseId: course.id,
          slug: course.slug,
          title: course.title,
          area: course.area,
          emoji: areaConfig?.emoji ?? '📚',
          currentModule: `${progress.completed}/${progress.total} lezioni`,
          progress: progress.percentage,
          isCompleted: progress.percentage === 100,
        };
      }),
  );

  return courses
    .filter((c) => !c.isCompleted)
    .sort((a, b) => b.progress - a.progress);
}

// ── Weekly Activity ─────────────────────────────────

interface DayActivity {
  label: string;
  minutes: number;
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export async function getWeeklyActivity(
  supabase: TypedClient,
  userId: string,
): Promise<DayActivity[]> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const { data: rawProgress } = await supabase
    .from('progress')
    .select('watch_time_sec, completed_at')
    .eq('user_id', userId)
    .gte('completed_at', monday.toISOString());

  const progressData = (rawProgress ?? []) as unknown as ProgressActivityRow[];

  const minutesByDay = new Array(7).fill(0) as number[];

  for (const p of progressData) {
    if (!p.completed_at) continue;
    const d = new Date(p.completed_at);
    let idx = d.getDay() - 1;
    if (idx < 0) idx = 6;
    minutesByDay[idx] += Math.round((p.watch_time_sec ?? 0) / 60);
  }

  return DAY_LABELS.map((label, i) => ({
    label,
    minutes: minutesByDay[i],
  }));
}
