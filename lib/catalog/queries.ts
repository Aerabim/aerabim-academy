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
  status: string;
  duration_min: number | null;
  thumbnail_url: string | null;
  thumbnail_expanded_url: string | null;
  avg_rating: number;
  review_count: number;
  is_featured: boolean;
  preview_playback_id: string | null;
  preview_asset_id: string | null;
  created_at: string;
}

interface ModuleRow {
  id: string;
  course_id: string;
  title: string;
  order_num: number;
}

interface ModuleSummary {
  id: string;
  title: string;
  orderNum: number;
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
  options?: { isAdmin?: boolean },
): Promise<CourseWithMeta[]> {
  let query = supabase
    .from('courses')
    .select('*');

  if (!options?.isAdmin) {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query.order('created_at', { ascending: false });

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
    .select('id, course_id, title, order_num')
    .in('course_id', courseIds);
  const modules = (rawModules ?? []) as unknown as { id: string; course_id: string; title: string; order_num: number }[];

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
  const modulesForCourseMap = new Map<string, ModuleSummary[]>();
  const lessonCountMap = new Map<string, number>();
  const enrollCountMap = new Map<string, number>();

  for (const mod of modules) {
    moduleCountMap.set(mod.course_id, (moduleCountMap.get(mod.course_id) ?? 0) + 1);
    const existing = modulesForCourseMap.get(mod.course_id) ?? [];
    existing.push({ id: mod.id, title: mod.title, orderNum: mod.order_num });
    modulesForCourseMap.set(mod.course_id, existing);
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
      rating: c.avg_rating ?? 0,
      reviewCount: c.review_count ?? 0,
      enrolledCount: enrollCountMap.get(c.id) ?? 0,
      isFeatured: c.is_featured ?? false,
      moduleCount: moduleCountMap.get(c.id) ?? 0,
      modules: (modulesForCourseMap.get(c.id) ?? [])
        .sort((a, b) => a.orderNum - b.orderNum)
        .slice(0, 5),
      lessonCount: lessonCountMap.get(c.id) ?? 0,
      createdAt: c.created_at,
      updatedAt: new Date(c.created_at).toLocaleDateString('it-IT', {
        month: 'long',
        year: 'numeric',
      }),
      languages: ['Italiano'],
      instructor: { name: 'AERABIM', role: 'Team Formazione', initials: 'AE' },
      emoji: area?.emoji ?? '📚',
      thumbnailUrl: c.thumbnail_url ?? null,
      thumbnailExpandedUrl: c.thumbnail_expanded_url ?? null,
      previewPlaybackId: c.preview_playback_id ?? null,
    };
  });
}

// ── Single course by slug ───────────────────────────

export async function getCourseBySlug(
  supabase: TypedClient,
  slug: string,
  options?: { isAdmin?: boolean },
): Promise<CourseWithMeta | null> {
  let query = supabase
    .from('courses')
    .select('*')
    .eq('slug', slug);

  if (!options?.isAdmin) {
    query = query.in('status', ['published', 'hidden']);
  }

  const { data, error } = await query.maybeSingle();

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
    rating: c.avg_rating ?? 0,
    reviewCount: c.review_count ?? 0,
    enrolledCount: enrolledCount ?? 0,
    isFeatured: c.is_featured ?? false,
    moduleCount: modules.length,
    lessonCount: rawLessons.length,
    createdAt: c.created_at,
    updatedAt: new Date(c.created_at).toLocaleDateString('it-IT', {
      month: 'long',
      year: 'numeric',
    }),
    languages: ['Italiano'],
    instructor: { name: 'AERABIM', role: 'Team Formazione', initials: 'AE' },
    emoji: area?.emoji ?? '📚',
    thumbnailUrl: c.thumbnail_url ?? null,
    thumbnailExpandedUrl: c.thumbnail_expanded_url ?? null,
    previewPlaybackId: c.preview_playback_id ?? null,
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
  const explicit = courses.find((c) => c.isFeatured);
  if (explicit) return explicit;
  // Fallback: corso con più iscritti
  const sorted = [...courses].sort((a, b) => b.enrolledCount - a.enrolledCount);
  return sorted[0];
}
