import { AREA_CONFIG } from '@/lib/area-config';
import { createServerClient } from '@/lib/supabase/server';
import { computeCourseProgress } from '@/lib/learn/queries';
import type { AreaCode, EnrolledCourse, BadgeInfo } from '@/types';

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
      .eq('status', 'published'),
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

export interface WeeklyActivityResult {
  days: DayActivity[];
  prevWeekMinutes: number;
}

export async function getWeeklyActivity(
  supabase: TypedClient,
  userId: string,
): Promise<WeeklyActivityResult> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const prevMonday = new Date(monday);
  prevMonday.setDate(monday.getDate() - 7);
  const prevSunday = new Date(monday);
  prevSunday.setMilliseconds(-1);

  const [currentRes, prevRes] = await Promise.all([
    supabase
      .from('progress')
      .select('watch_time_sec, completed_at')
      .eq('user_id', userId)
      .gte('completed_at', monday.toISOString()),
    supabase
      .from('progress')
      .select('watch_time_sec')
      .eq('user_id', userId)
      .gte('completed_at', prevMonday.toISOString())
      .lte('completed_at', prevSunday.toISOString()),
  ]);

  const progressData = (currentRes.data ?? []) as unknown as ProgressActivityRow[];
  const prevData = (prevRes.data ?? []) as unknown as ProgressRow[];

  const minutesByDay = new Array(7).fill(0) as number[];
  for (const p of progressData) {
    if (!p.completed_at) continue;
    const d = new Date(p.completed_at);
    let idx = d.getDay() - 1;
    if (idx < 0) idx = 6;
    minutesByDay[idx] += Math.round((p.watch_time_sec ?? 0) / 60);
  }

  const prevWeekMinutes = prevData.reduce(
    (sum, p) => sum + Math.round((p.watch_time_sec ?? 0) / 60),
    0,
  );

  return {
    days: DAY_LABELS.map((label, i) => ({ label, minutes: minutesByDay[i] })),
    prevWeekMinutes,
  };
}

// ── Badges (Traguardi) ──────────────────────────────

interface CompletedProgressRow {
  completed_at: string | null;
  lessons: {
    modules: {
      courses: { id: string; area: string } | null;
    } | null;
  } | null;
}

interface ModuleWithLessonIds {
  course_id: string;
  lessons: { id: string }[];
}

const BADGE_DEFINITIONS: Omit<BadgeInfo, 'unlocked'>[] = [
  { id: 'primo-passo',       name: 'Primo Passo',       desc: 'Almeno 1 lezione completata',            emoji: '👣' },
  { id: 'in-carreggiata',    name: 'In Carreggiata',    desc: 'Almeno 5 lezioni completate',            emoji: '🚀' },
  { id: 'primo-traguardo',   name: 'Primo Traguardo',   desc: 'Almeno 1 corso completato al 100%',      emoji: '🏁' },
  { id: 'studioso',          name: 'Studioso',          desc: 'Almeno 3 corsi completati al 100%',      emoji: '📚' },
  { id: 'certificato',       name: 'Certificato',       desc: 'Almeno 1 certificato ottenuto',          emoji: '🎓' },
  { id: 'streak-7',          name: 'Streak 7 Giorni',   desc: '7 giorni consecutivi di studio',         emoji: '🔥' },
  { id: 'esperto-bim',       name: 'Esperto BIM',       desc: 'Completato almeno 1 corso OpenBIM',      emoji: '📐' },
  { id: 'multidisciplinare', name: 'Multidisciplinare', desc: 'Corsi completati in 2 o più aree',       emoji: '🌐' },
];

function hasConsecutiveStreak(dates: string[], required: number): boolean {
  if (dates.length < required) return false;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diffDays =
      (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86_400_000;
    if (diffDays === 1) {
      streak++;
      if (streak >= required) return true;
    } else if (diffDays > 1) {
      streak = 1;
    }
  }
  return streak >= required;
}

export async function getUserBadges(
  supabase: TypedClient,
  userId: string,
): Promise<BadgeInfo[]> {
  // Round 1: 3 query parallele
  const [completedRes, enrollmentsRes, certsRes] = await Promise.all([
    supabase
      .from('progress')
      .select('completed_at, lessons(modules(courses(id, area)))')
      .eq('user_id', userId)
      .eq('completed', true),
    supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', userId),
    supabase
      .from('certificates')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  const completed = (completedRes.data ?? []) as unknown as CompletedProgressRow[];
  const courseIds = ((enrollmentsRes.data ?? []) as unknown as { course_id: string }[])
    .map((e) => e.course_id);
  const certCount = certsRes.count ?? 0;

  // Round 2: totale lezioni per corso (per calcolare 100%)
  const totalLessonsRes = courseIds.length > 0
    ? await supabase
        .from('modules')
        .select('course_id, lessons(id)')
        .in('course_id', courseIds)
    : { data: [] };

  const modules = (totalLessonsRes.data ?? []) as unknown as ModuleWithLessonIds[];

  // Totale lezioni per courseId
  const totalByCourse = new Map<string, number>();
  for (const mod of modules) {
    totalByCourse.set(
      mod.course_id,
      (totalByCourse.get(mod.course_id) ?? 0) + mod.lessons.length,
    );
  }

  // Lezioni completate per courseId e area
  const completedByCourse = new Map<string, number>();
  const areaByCourse = new Map<string, string>();
  const completedDates: string[] = [];

  for (const row of completed) {
    const courseId = row.lessons?.modules?.courses?.id;
    const area = row.lessons?.modules?.courses?.area;
    if (courseId) {
      completedByCourse.set(courseId, (completedByCourse.get(courseId) ?? 0) + 1);
      if (area) areaByCourse.set(courseId, area);
    }
    if (row.completed_at) {
      completedDates.push(row.completed_at.slice(0, 10));
    }
  }

  // Corsi completati al 100%
  const completedCourseIds = courseIds.filter((id) => {
    const total = totalByCourse.get(id) ?? 0;
    const done = completedByCourse.get(id) ?? 0;
    return total > 0 && done >= total;
  });

  const completedAreasSet = new Set(
    completedCourseIds.map((id) => areaByCourse.get(id)).filter(Boolean),
  );

  // Streak: date distinte ordinate
  const sortedDates = [...new Set(completedDates)].sort();

  // Calcolo badge
  const unlockedMap: Record<string, boolean> = {
    'primo-passo':       completed.length >= 1,
    'in-carreggiata':    completed.length >= 5,
    'primo-traguardo':   completedCourseIds.length >= 1,
    'studioso':          completedCourseIds.length >= 3,
    'certificato':       certCount >= 1,
    'streak-7':          hasConsecutiveStreak(sortedDates, 7),
    'esperto-bim':       completedCourseIds.some((id) => areaByCourse.get(id) === 'OB'),
    'multidisciplinare': completedAreasSet.size >= 2,
  };

  return BADGE_DEFINITIONS.map((def) => ({
    ...def,
    unlocked: unlockedMap[def.id] ?? false,
  }));
}
