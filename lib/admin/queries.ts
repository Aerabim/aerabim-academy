import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AdminOverviewStats,
  AdminActivityEvent,
  AdminDraftCourse,
  AdminTopCourse,
  AdminCourseDetail,
  AdminModuleWithLessons,
} from '@/types';

// ─── Activity feed ────────────────────────────────────────────────────────────

export type ActivityAccessType = 'single' | 'pro_subscription' | 'free' | 'team';

export interface AdminCourseActivityItem {
  id: string;
  type: 'created' | 'enrollment';
  userName: string;
  userEmail: string;
  accessType?: ActivityAccessType;
  date: string;
}

/**
 * Returns a chronological activity log for one course:
 * - course creation event
 * - up to 30 most recent enrollments enriched with user data
 */
export async function getAdminCourseActivity(
  admin: SupabaseClient,
  courseId: string,
  courseCreatedAt: string,
): Promise<AdminCourseActivityItem[]> {
  try {
    const { data: enrollmentsRaw } = await admin
      .from('enrollments')
      .select('id, user_id, access_type, created_at')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(30);

    const enrollments = (enrollmentsRaw ?? []) as {
      id: string; user_id: string; access_type: string; created_at: string;
    }[];

    const userIds = Array.from(new Set(enrollments.map((e) => e.user_id)));

    const [profilesRes, authRes] = await Promise.all([
      userIds.length > 0
        ? admin.from('profiles').select('id, display_name').in('id', userIds)
        : Promise.resolve({ data: [] as { id: string; display_name: string | null }[] }),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    const nameMap = new Map(
      ((profilesRes.data ?? []) as { id: string; display_name: string | null }[])
        .map((u) => [u.id, u.display_name ?? '']),
    );
    const emailMap = new Map<string, string>();
    for (const u of authRes.data?.users ?? []) {
      emailMap.set(u.id, u.email ?? '');
    }

    const enrollmentItems: AdminCourseActivityItem[] = enrollments.map((e) => ({
      id: e.id,
      type: 'enrollment',
      userName: nameMap.get(e.user_id) || emailMap.get(e.user_id) || 'Utente',
      userEmail: emailMap.get(e.user_id) ?? '',
      accessType: e.access_type as ActivityAccessType,
      date: e.created_at,
    }));

    const creationItem: AdminCourseActivityItem = {
      id: 'creation',
      type: 'created',
      userName: 'Sistema',
      userEmail: '',
      date: courseCreatedAt,
    };

    return [...enrollmentItems, creationItem];
  } catch (err) {
    console.error('getAdminCourseActivity error:', err);
    return [];
  }
}

export interface AdminCourseStats {
  enrolledCount: number;
  completionCount: number;
}

/**
 * Fetches enrollment count and full-course completion count for a single course.
 * completionCount = distinct users who have completed every lesson in the course.
 */
export async function getAdminCourseStats(
  admin: SupabaseClient,
  courseId: string,
  lessonIds: string[],
): Promise<AdminCourseStats> {
  try {
    const [enrollResult, progressResult] = await Promise.all([
      admin
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', courseId),
      lessonIds.length > 0
        ? admin
            .from('progress')
            .select('user_id, lesson_id')
            .in('lesson_id', lessonIds)
            .eq('completed', true)
        : Promise.resolve({ data: [] as { user_id: string; lesson_id: string }[] }),
    ]);

    const enrolledCount = enrollResult.count ?? 0;

    let completionCount = 0;
    if (lessonIds.length > 0) {
      const rows = (progressResult.data ?? []) as { user_id: string; lesson_id: string }[];
      const byUser = new Map<string, Set<string>>();
      for (const row of rows) {
        if (!byUser.has(row.user_id)) byUser.set(row.user_id, new Set());
        byUser.get(row.user_id)!.add(row.lesson_id);
      }
      for (const completed of byUser.values()) {
        if (lessonIds.every((id) => completed.has(id))) completionCount++;
      }
    }

    return { enrolledCount, completionCount };
  } catch (err) {
    console.error('getAdminCourseStats error:', err);
    return { enrolledCount: 0, completionCount: 0 };
  }
}

/**
 * Fetches aggregate stats for the admin overview dashboard.
 * Uses the admin (service_role) client to read across all users.
 *
 * Two-round strategy:
 *   Round 1 — all independent queries in parallel (counts + raw rows)
 *   Round 2 — enrichment queries that depend on Round 1 user/course IDs
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
    newUsersThisWeek: 0,
    newEnrollmentsThisWeek: 0,
    activityFeed: [],
    draftCourses: [],
    topCourses: [],
  };

  try {
    const now = new Date().toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // ── Round 1: all independent queries ──────────────────────────────────────
    const [
      usersResult,
      enrollmentsResult,
      publishedCoursesResult,
      totalCoursesResult,
      pendingRequestsResult,
      newUsersResult,
      newEnrollmentsResult,
      recentEnrollmentsResult,
      recentUsersResult,
      recentSessionRequestsResult,
      draftCoursesResult,
      allEnrollmentCourseIdsResult,
    ] = await Promise.all([
      // Total users
      admin.from('profiles').select('id', { count: 'exact', head: true }),

      // Active enrollments
      admin
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .or('expires_at.is.null,expires_at.gt.' + now),

      // Published courses
      admin.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'published'),

      // Total courses
      admin.from('courses').select('id', { count: 'exact', head: true }),

      // Pending session requests
      admin.from('session_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),

      // Delta: new users this week
      admin.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),

      // Delta: new enrollments this week
      admin.from('enrollments').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),

      // Recent enrollments for activity feed + backwards-compat (last 10)
      admin
        .from('enrollments')
        .select('id, user_id, course_id, access_type, created_at')
        .order('created_at', { ascending: false })
        .limit(10),

      // Recent new users for activity feed (last 10)
      admin
        .from('profiles')
        .select('id, display_name, created_at')
        .order('created_at', { ascending: false })
        .limit(10),

      // Recent session requests for activity feed (last 10)
      admin
        .from('session_requests')
        .select('id, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10),

      // Draft / unpublished courses
      admin
        .from('courses')
        .select('id, title, status, updated_at')
        .neq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(8),

      // All enrollment course_ids for top-courses computation
      admin.from('enrollments').select('course_id'),
    ]);

    // ── Collect all user IDs needing enrichment ────────────────────────────────
    type RawEnrollment = { id: string; user_id: string; course_id: string; access_type: string; created_at: string };
    type RawProfile    = { id: string; display_name: string | null; created_at: string };
    type RawRequest    = { id: string; user_id: string; created_at: string };
    type RawDraft      = { id: string; title: string; status: string; updated_at: string };
    type RawCourseId   = { course_id: string };

    const rawEnrollments     = (recentEnrollmentsResult.data    ?? []) as RawEnrollment[];
    const rawRecentUsers     = (recentUsersResult.data          ?? []) as RawProfile[];
    const rawSessionRequests = (recentSessionRequestsResult.data ?? []) as RawRequest[];
    const rawDrafts          = (draftCoursesResult.data         ?? []) as RawDraft[];
    const rawCourseIds       = (allEnrollmentCourseIdsResult.data ?? []) as RawCourseId[];

    // Top courses: count enrollments per course_id in JS
    const enrollCountMap = new Map<string, number>();
    for (const { course_id } of rawCourseIds) {
      enrollCountMap.set(course_id, (enrollCountMap.get(course_id) ?? 0) + 1);
    }
    const topCourseIds = Array.from(enrollCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    // Aggregate unique user IDs and course IDs for Round 2
    const allUserIds = Array.from(new Set([
      ...rawEnrollments.map((e) => e.user_id),
      ...rawSessionRequests.map((r) => r.user_id),
    ]));
    const allCourseIds = Array.from(new Set([
      ...rawEnrollments.map((e) => e.course_id),
      ...topCourseIds,
    ]));

    // ── Round 2: enrichment ────────────────────────────────────────────────────
    const [profilesData, coursesData, authData] = await Promise.all([
      allUserIds.length > 0
        ? admin.from('profiles').select('id, display_name').in('id', allUserIds)
        : Promise.resolve({ data: [] as RawProfile[] }),

      allCourseIds.length > 0
        ? admin.from('courses').select('id, title').in('id', allCourseIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),

      admin.auth.admin.listUsers({ perPage: 1000 }).catch(() => ({ data: { users: [] } })),
    ]);

    const nameMap = new Map(
      ((profilesData.data ?? []) as RawProfile[]).map((u) => [u.id, u.display_name ?? 'Utente']),
    );
    const courseMap = new Map(
      ((coursesData.data ?? []) as { id: string; title: string }[]).map((c) => [c.id, c.title]),
    );
    const emailMap = new Map<string, string>();
    for (const u of authData.data?.users ?? []) {
      emailMap.set(u.id, u.email ?? '');
    }
    // Merge display_name from profiles into nameMap for recent users (already fetched)
    for (const u of rawRecentUsers) {
      if (!nameMap.has(u.id)) nameMap.set(u.id, u.display_name ?? 'Utente');
    }

    // ── Build activity feed (merge + sort, keep latest 15) ────────────────────
    const feedEnrollments: AdminActivityEvent[] = rawEnrollments.map((e) => ({
      id: `enroll-${e.id}`,
      type: 'enrollment' as const,
      userName:    nameMap.get(e.user_id)  ?? 'Utente',
      userEmail:   emailMap.get(e.user_id) ?? '',
      courseTitle: courseMap.get(e.course_id) ?? 'Corso',
      accessType:  e.access_type,
      date:        e.created_at,
    }));

    const feedNewUsers: AdminActivityEvent[] = rawRecentUsers.map((u) => ({
      id:        `user-${u.id}`,
      type:      'new_user' as const,
      userName:  u.display_name ?? emailMap.get(u.id) ?? 'Utente',
      userEmail: emailMap.get(u.id) ?? '',
      date:      u.created_at,
    }));

    const feedRequests: AdminActivityEvent[] = rawSessionRequests.map((r) => ({
      id:        `req-${r.id}`,
      type:      'session_request' as const,
      userName:  nameMap.get(r.user_id)  ?? emailMap.get(r.user_id) ?? 'Utente',
      userEmail: emailMap.get(r.user_id) ?? '',
      date:      r.created_at,
    }));

    const activityFeed = [...feedEnrollments, ...feedNewUsers, ...feedRequests]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 15);

    // ── Build top courses ──────────────────────────────────────────────────────
    const topCourses: AdminTopCourse[] = topCourseIds
      .map((id) => ({
        id,
        title:           courseMap.get(id) ?? 'Corso',
        enrollmentCount: enrollCountMap.get(id) ?? 0,
      }));

    // ── Build draft courses ────────────────────────────────────────────────────
    const draftCourses: AdminDraftCourse[] = rawDrafts.map((d) => ({
      id:        d.id,
      title:     d.title,
      status:    d.status,
      updatedAt: d.updated_at,
    }));

    return {
      totalUsers:              usersResult.count          ?? 0,
      activeEnrollments:       enrollmentsResult.count    ?? 0,
      publishedCourses:        publishedCoursesResult.count ?? 0,
      totalCourses:            totalCoursesResult.count   ?? 0,
      pendingSessionRequests:  pendingRequestsResult.count ?? 0,
      newUsersThisWeek:        newUsersResult.count       ?? 0,
      newEnrollmentsThisWeek:  newEnrollmentsResult.count ?? 0,
      activityFeed,
      draftCourses,
      topCourses,
    };
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
      .select('id, module_id, title, order_num, type, mux_playback_id, mux_asset_id, mux_status, duration_sec, is_preview')
      .in('module_id', moduleIds.length > 0 ? moduleIds : [''])
      .order('order_num', { ascending: true });

    const lessons = (lessonsRaw ?? []) as {
      id: string; module_id: string; title: string; order_num: number;
      type: string; mux_playback_id: string | null; mux_asset_id: string | null;
      mux_status: string; duration_sec: number | null; is_preview: boolean;
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
        type: l.type as 'video' | 'quiz' | 'esercitazione',
        muxPlaybackId: l.mux_playback_id,
        muxAssetId: l.mux_asset_id,
        muxStatus: l.mux_status,
        durationSec: l.duration_sec,
        isPreview: l.is_preview,
        quizQuestionCount: quizCountMap.get(l.id) ?? 0,
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
