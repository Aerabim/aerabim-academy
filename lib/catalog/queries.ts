import { AREA_CONFIG } from '@/lib/area-config';
import { createServerClient } from '@/lib/supabase/server';
import type {
  AreaCode,
  LevelCode,
  CourseWithMeta,
  ModuleWithLessons,
  LessonDisplay,
} from '@/types';

type TypedClient = ReturnType<typeof createServerClient>;

// ── Row types (Supabase generic inference workaround) ──

interface CourseRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  area: string;
  level: string;
  price_single: number;
  is_free: boolean;
  is_published: boolean;
  duration_min: number | null;
  thumbnail_url: string | null;
  created_at: string;
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
  type: string;
  duration_sec: number | null;
  is_preview: boolean;
}

// ── Catalog: all published courses ──────────────────

export async function getPublishedCourses(
  supabase: TypedClient,
): Promise<CourseWithMeta[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }

  const courses = (data ?? []) as unknown as CourseRow[];
  if (courses.length === 0) return [];

  const courseIds = courses.map((c) => c.id);

  // Fetch module/lesson counts
  const { data: rawModules } = await supabase
    .from('modules')
    .select('id, course_id')
    .in('course_id', courseIds);
  const modules = (rawModules ?? []) as unknown as { id: string; course_id: string }[];

  const moduleIds = modules.map((m) => m.id);

  const rawLessons = moduleIds.length > 0
    ? ((await supabase.from('lessons').select('id, module_id').in('module_id', moduleIds)).data ?? []) as unknown as { id: string; module_id: string }[]
    : [];

  // Enrollment counts
  const { data: rawEnrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .in('course_id', courseIds);
  const enrollments = (rawEnrollments ?? []) as unknown as { course_id: string }[];

  // Build lookup maps
  const moduleCountMap = new Map<string, number>();
  const lessonCountMap = new Map<string, number>();
  const enrollCountMap = new Map<string, number>();

  for (const mod of modules) {
    moduleCountMap.set(mod.course_id, (moduleCountMap.get(mod.course_id) ?? 0) + 1);
  }

  const moduleToCourse = new Map<string, string>();
  for (const mod of modules) {
    moduleToCourse.set(mod.id, mod.course_id);
  }
  for (const lesson of rawLessons) {
    const courseId = moduleToCourse.get(lesson.module_id);
    if (courseId) {
      lessonCountMap.set(courseId, (lessonCountMap.get(courseId) ?? 0) + 1);
    }
  }

  for (const enr of enrollments) {
    enrollCountMap.set(enr.course_id, (enrollCountMap.get(enr.course_id) ?? 0) + 1);
  }

  return courses.map((c) => {
    const area = AREA_CONFIG[c.area as AreaCode];
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description ?? '',
      area: c.area as AreaCode,
      level: c.level as LevelCode,
      priceSingle: c.price_single,
      isFree: c.is_free,
      durationMin: c.duration_min ?? 0,
      rating: 0,
      enrolledCount: enrollCountMap.get(c.id) ?? 0,
      moduleCount: moduleCountMap.get(c.id) ?? 0,
      lessonCount: lessonCountMap.get(c.id) ?? 0,
      updatedAt: new Date(c.created_at).toLocaleDateString('it-IT', {
        month: 'long',
        year: 'numeric',
      }),
      languages: ['Italiano'],
      instructor: { name: 'AERABIM', role: 'Team Formazione', initials: 'AE' },
      emoji: area?.emoji ?? '📚',
    };
  });
}

// ── Single course by slug ───────────────────────────

export async function getCourseBySlug(
  supabase: TypedClient,
  slug: string,
): Promise<CourseWithMeta | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data) return null;
  const c = data as unknown as CourseRow;

  // Get counts
  const { data: rawModules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', c.id);
  const modules = (rawModules ?? []) as unknown as { id: string }[];
  const moduleIds = modules.map((m) => m.id);

  const rawLessons = moduleIds.length > 0
    ? ((await supabase.from('lessons').select('id').in('module_id', moduleIds)).data ?? []) as unknown as { id: string }[]
    : [];

  const { count: enrolledCount } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', c.id);

  const area = AREA_CONFIG[c.area as AreaCode];

  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description ?? '',
    area: c.area as AreaCode,
    level: c.level as LevelCode,
    priceSingle: c.price_single,
    isFree: c.is_free,
    durationMin: c.duration_min ?? 0,
    rating: 0,
    enrolledCount: enrolledCount ?? 0,
    moduleCount: modules.length,
    lessonCount: rawLessons.length,
    updatedAt: new Date(c.created_at).toLocaleDateString('it-IT', {
      month: 'long',
      year: 'numeric',
    }),
    languages: ['Italiano'],
    instructor: { name: 'AERABIM', role: 'Team Formazione', initials: 'AE' },
    emoji: area?.emoji ?? '📚',
  };
}

// ── Modules + Lessons for a course ──────────────────

export async function getCourseModulesWithLessons(
  supabase: TypedClient,
  courseId: string,
): Promise<ModuleWithLessons[]> {
  const { data: rawModules, error } = await supabase
    .from('modules')
    .select('id, course_id, title, order_num')
    .eq('course_id', courseId)
    .order('order_num', { ascending: true });

  if (error || !rawModules || rawModules.length === 0) return [];
  const modules = rawModules as unknown as ModuleRow[];

  const moduleIds = modules.map((m) => m.id);

  const { data: rawLessons } = await supabase
    .from('lessons')
    .select('id, module_id, title, order_num, type, duration_sec, is_preview')
    .in('module_id', moduleIds)
    .order('order_num', { ascending: true });

  const lessons = (rawLessons ?? []) as unknown as LessonRow[];

  const lessonsByModule = new Map<string, LessonDisplay[]>();
  for (const l of lessons) {
    const arr = lessonsByModule.get(l.module_id) ?? [];
    arr.push({
      id: l.id,
      moduleId: l.module_id,
      title: l.title,
      description: '',
      orderNum: l.order_num,
      type: l.type as LessonDisplay['type'],
      durationSec: l.duration_sec,
      isPreview: l.is_preview,
      status: 'locked',
    });
    lessonsByModule.set(l.module_id, arr);
  }

  return modules.map((m) => ({
    id: m.id,
    courseId: m.course_id,
    title: m.title,
    orderNum: m.order_num,
    lessons: lessonsByModule.get(m.id) ?? [],
  }));
}

// ── Featured course (most enrollments) ──────────────

export async function getFeaturedCourse(
  supabase: TypedClient,
  courses: CourseWithMeta[],
): Promise<CourseWithMeta | null> {
  if (courses.length === 0) return null;
  const sorted = [...courses].sort((a, b) => b.enrolledCount - a.enrolledCount);
  return sorted[0];
}
