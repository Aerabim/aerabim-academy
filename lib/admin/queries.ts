import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminOverviewStats, AdminRecentEnrollment, AdminCourseDetail, AdminModuleWithLessons } from '@/types';

/**
 * Fetches aggregate stats for the admin overview dashboard.
 * Uses the admin (service_role) client to read across all users.
 */
export async function getAdminOverviewStats(
  admin: SupabaseClient,
): Promise<AdminOverviewStats> {
  const defaults: AdminOverviewStats = {
    totalUsers: 0,
    activeEnrollments: 0,
    publishedCourses: 0,
    totalCourses: 0,
    pendingSessionRequests: 0,
    recentEnrollments: [],
  };

  try {
    const [
      usersResult,
      enrollmentsResult,
      publishedCoursesResult,
      totalCoursesResult,
      pendingRequestsResult,
      recentEnrollmentsResult,
    ] = await Promise.all([
      // Total users (profiles count)
      admin
        .from('profiles')
        .select('id', { count: 'exact', head: true }),

      // Active enrollments (not expired)
      admin
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString()),

      // Published courses
      admin
        .from('courses')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),

      // Total courses
      admin
        .from('courses')
        .select('id', { count: 'exact', head: true }),

      // Pending session requests
      admin
        .from('session_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // Recent enrollments (last 10)
      admin
        .from('enrollments')
        .select('id, user_id, course_id, access_type, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const stats: AdminOverviewStats = {
      totalUsers: usersResult.count ?? 0,
      activeEnrollments: enrollmentsResult.count ?? 0,
      publishedCourses: publishedCoursesResult.count ?? 0,
      totalCourses: totalCoursesResult.count ?? 0,
      pendingSessionRequests: pendingRequestsResult.count ?? 0,
      recentEnrollments: [],
    };

    // Enrich recent enrollments with user and course info
    const rawEnrollments = (recentEnrollmentsResult.data ?? []) as {
      id: string;
      user_id: string;
      course_id: string;
      access_type: string;
      created_at: string;
    }[];

    if (rawEnrollments.length > 0) {
      const userIds = Array.from(new Set(rawEnrollments.map((e) => e.user_id)));
      const courseIds = Array.from(new Set(rawEnrollments.map((e) => e.course_id)));

      const [usersData, coursesData] = await Promise.all([
        admin
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds),
        admin
          .from('courses')
          .select('id, title')
          .in('id', courseIds),
      ]);

      const userMap = new Map(
        ((usersData.data ?? []) as { id: string; display_name: string | null }[]).map(
          (u) => [u.id, u.display_name ?? 'Utente'],
        ),
      );

      const courseMap = new Map(
        ((coursesData.data ?? []) as { id: string; title: string }[]).map(
          (c) => [c.id, c.title],
        ),
      );

      // Get emails from auth (admin can list users)
      const emailMap = new Map<string, string>();
      try {
        const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
        if (authUsers?.users) {
          for (const u of authUsers.users) {
            emailMap.set(u.id, u.email ?? '');
          }
        }
      } catch {
        // Email lookup is optional
      }

      stats.recentEnrollments = rawEnrollments.map((e): AdminRecentEnrollment => ({
        id: e.id,
        userEmail: emailMap.get(e.user_id) ?? '',
        userName: userMap.get(e.user_id) ?? 'Utente',
        courseTitle: courseMap.get(e.course_id) ?? 'Corso',
        accessType: e.access_type,
        createdAt: e.created_at,
      }));
    }

    return stats;
  } catch (err) {
    console.error('getAdminOverviewStats error:', err);
    return defaults;
  }
}

/**
 * Fetches a course with its full module/lesson/quiz structure for admin editing.
 */
export async function getAdminCourseDetail(
  admin: SupabaseClient,
  courseId: string,
): Promise<AdminCourseDetail | null> {
  try {
    // Fetch course
    const { data: course, error: courseError } = await admin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) return null;

    // Fetch modules
    const { data: modulesRaw } = await admin
      .from('modules')
      .select('id, course_id, title, order_num')
      .eq('course_id', courseId)
      .order('order_num', { ascending: true });

    const modules = (modulesRaw ?? []) as { id: string; course_id: string; title: string; order_num: number }[];
    const moduleIds = modules.map((m) => m.id);

    // Fetch lessons for all modules
    const { data: lessonsRaw } = await admin
      .from('lessons')
      .select('id, module_id, title, order_num, type, mux_playback_id, mux_asset_id, mux_status, duration_sec, is_preview, material_url')
      .in('module_id', moduleIds.length > 0 ? moduleIds : [''])
      .order('order_num', { ascending: true });

    const lessons = (lessonsRaw ?? []) as {
      id: string; module_id: string; title: string; order_num: number;
      type: string; mux_playback_id: string | null; mux_asset_id: string | null;
      mux_status: string; duration_sec: number | null; is_preview: boolean;
      material_url: string | null;
    }[];

    // Fetch quiz question counts per lesson
    const lessonIds = lessons.filter((l) => l.type === 'quiz').map((l) => l.id);
    const quizCountMap = new Map<string, number>();

    if (lessonIds.length > 0) {
      const { data: quizData } = await admin
        .from('quiz_questions')
        .select('lesson_id')
        .in('lesson_id', lessonIds);

      for (const q of (quizData ?? []) as { lesson_id: string }[]) {
        quizCountMap.set(q.lesson_id, (quizCountMap.get(q.lesson_id) ?? 0) + 1);
      }
    }

    // Group lessons by module
    const lessonsByModule = new Map<string, typeof lessons>();
    for (const lesson of lessons) {
      const arr = lessonsByModule.get(lesson.module_id) ?? [];
      arr.push(lesson);
      lessonsByModule.set(lesson.module_id, arr);
    }

    const enrichedModules: AdminModuleWithLessons[] = modules.map((m) => ({
      id: m.id,
      courseId: m.course_id,
      title: m.title,
      orderNum: m.order_num,
      lessons: (lessonsByModule.get(m.id) ?? []).map((l) => ({
        id: l.id,
        moduleId: l.module_id,
        title: l.title,
        orderNum: l.order_num,
        type: l.type as 'video' | 'quiz' | 'material' | 'esercitazione',
        muxPlaybackId: l.mux_playback_id,
        muxAssetId: l.mux_asset_id,
        muxStatus: l.mux_status,
        durationSec: l.duration_sec,
        isPreview: l.is_preview,
        quizQuestionCount: quizCountMap.get(l.id) ?? 0,
        materialUrl: l.material_url,
      })),
    }));

    return {
      course: course as AdminCourseDetail['course'],
      modules: enrichedModules,
    };
  } catch (err) {
    console.error('getAdminCourseDetail error:', err);
    return null;
  }
}
