import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type {
  ApiError,
  FeedItem,
  FeedItemProgress,
  FeedItemCertificate,
  FeedItemEnrollment,
  FeedItemDiscussion,
  FeedItemAdminPost,
  FeedPrivacy,
} from '@/types';

export const dynamic = 'force-dynamic';

const LIMIT = 20;

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** GET /api/feed?offset=0 — unified chronological feed */
export async function GET(request: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Devi effettuare il login.' } satisfies ApiError,
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10));
    const now = new Date().toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // ── 1. Fetch config + user privacy + hidden items in parallel ──
    const [configRes, profileRes, hiddenRes] = await Promise.all([
      supabase.from('feed_config').select('*').eq('id', 1).maybeSingle(),
      supabase.from('profiles').select('feed_privacy').eq('id', user.id).maybeSingle(),
      supabase.from('feed_hidden_items').select('item_type, item_id'),
    ]);

    const config = (configRes.data ?? {
      progress_enabled: true,
      certificates_enabled: true,
      enrollments_enabled: true,
      discussions_enabled: true,
    }) as {
      progress_enabled: boolean;
      certificates_enabled: boolean;
      enrollments_enabled: boolean;
      discussions_enabled: boolean;
    };

    const privacy = ((profileRes.data as { feed_privacy: FeedPrivacy } | null)?.feed_privacy) ?? {
      show_progress: true,
      show_certificates: true,
      show_enrollments: true,
      show_online: true,
    };

    const hiddenSet = new Set(
      ((hiddenRes.data ?? []) as { item_type: string; item_id: string }[])
        .map((h) => `${h.item_type}:${h.item_id}`),
    );

    // ── 2. Fetch all active sources in parallel ──
    const [progressRes, certsRes, enrollmentsRes, discussionsRes, adminPostsRes, sessionsRes] =
      await Promise.all([
        // Progressi lezioni completate (ultimi 7gg)
        config.progress_enabled && privacy.show_progress
          ? supabase
              .from('progress')
              .select('id, user_id, lesson_id, completed_at')
              .eq('completed', true)
              .gte('completed_at', sevenDaysAgo)
              .order('completed_at', { ascending: false })
              .limit(50)
          : Promise.resolve({ data: [] }),

        // Certificati conseguiti (ultimi 7gg)
        config.certificates_enabled && privacy.show_certificates
          ? supabase
              .from('certificates')
              .select('id, user_id, course_id, verify_code, issued_at')
              .gte('issued_at', sevenDaysAgo)
              .order('issued_at', { ascending: false })
              .limit(50)
          : Promise.resolve({ data: [] }),

        // Iscrizioni ai corsi (ultimi 7gg)
        config.enrollments_enabled && privacy.show_enrollments
          ? supabase
              .from('enrollments')
              .select('id, user_id, course_id, created_at')
              .gte('created_at', sevenDaysAgo)
              .order('created_at', { ascending: false })
              .limit(50)
          : Promise.resolve({ data: [] }),

        // Discussioni community (ultimi 7gg)
        config.discussions_enabled
          ? supabase
              .from('community_discussions')
              .select('id, title, category_id, reply_count, created_at, author_id')
              .eq('is_deleted', false)
              .gte('created_at', sevenDaysAgo)
              .order('created_at', { ascending: false })
              .limit(50)
          : Promise.resolve({ data: [] }),

        // Post admin pubblicati
        supabase
          .from('feed_posts')
          .select('id, author_id, title, body, href, is_pinned, is_published, created_at')
          .eq('is_published', true)
          .order('created_at', { ascending: false }),

        // Sessioni imminenti per sidebar (separato dal feed principale)
        supabase
          .from('live_sessions')
          .select('id, type, title, host_name, scheduled_at, duration_min, status, max_participants')
          .eq('is_published', true)
          .gte('scheduled_at', now)
          .in('status', ['scheduled', 'live'])
          .order('scheduled_at', { ascending: true })
          .limit(5),
      ]);

    // ── 3. Collect all user IDs needing profile lookup ──
    type ProgressRow = { id: string; user_id: string; lesson_id: string; completed_at: string };
    type CertRow = { id: string; user_id: string; course_id: string; verify_code: string; issued_at: string };
    type EnrollRow = { id: string; user_id: string; course_id: string; created_at: string };
    type DiscussionRow = { id: string; title: string; category_id: string; reply_count: number; created_at: string; author_id: string };
    type AdminPostRow = { id: string; author_id: string; title: string; body: string; href: string | null; is_pinned: boolean; is_published: boolean; created_at: string };

    const progresses = (progressRes.data ?? []) as ProgressRow[];
    const certs = (certsRes.data ?? []) as CertRow[];
    const enrollments = (enrollmentsRes.data ?? []) as EnrollRow[];
    const discussions = (discussionsRes.data ?? []) as DiscussionRow[];
    const adminPosts = (adminPostsRes.data ?? []) as AdminPostRow[];

    const userIds = Array.from(new Set([
      ...progresses.map((p) => p.user_id),
      ...certs.map((c) => c.user_id),
      ...enrollments.map((e) => e.user_id),
      ...discussions.map((d) => d.author_id),
      ...adminPosts.map((p) => p.author_id),
    ]));

    const lessonIds = progresses.map((p) => p.lesson_id);
    const courseIds = Array.from(new Set([
      ...certs.map((c) => c.course_id),
      ...enrollments.map((e) => e.course_id),
    ]));
    const categoryIds = Array.from(new Set(discussions.map((d) => d.category_id)));

    // ── 4. Fetch lookup data in parallel ──
    const [profilesRes, lessonsRes, coursesRes, categoriesRes, bookingsRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from('profiles').select('id, display_name').in('id', userIds)
        : Promise.resolve({ data: [] }),

      lessonIds.length > 0
        ? supabase.from('lessons').select('id, title, module_id').in('id', lessonIds)
        : Promise.resolve({ data: [] }),

      courseIds.length > 0
        ? supabase.from('courses').select('id, title, slug').in('id', courseIds)
        : Promise.resolve({ data: [] }),

      categoryIds.length > 0
        ? supabase.from('community_categories').select('id, slug').in('id', categoryIds)
        : Promise.resolve({ data: [] }),

      // Prenotazioni sessioni
      sessionsRes.data && sessionsRes.data.length > 0
        ? supabase
            .from('live_session_bookings')
            .select('session_id, user_id')
            .in('session_id', (sessionsRes.data as { id: string }[]).map((s) => s.id))
            .eq('status', 'confirmed')
        : Promise.resolve({ data: [] }),
    ]);

    // ── 5. Build lookup maps ──
    const profileMap = new Map(
      ((profilesRes.data ?? []) as { id: string; display_name: string | null }[])
        .map((p) => [p.id, p.display_name ?? 'Utente']),
    );

    const lessonMap = new Map(
      ((lessonsRes.data ?? []) as { id: string; title: string; module_id: string }[])
        .map((l) => [l.id, l]),
    );

    // Find course for each lesson via modules
    const moduleIds = Array.from(new Set(
      ((lessonsRes.data ?? []) as { module_id: string }[]).map((l) => l.module_id),
    ));
    const { data: modulesRaw } = moduleIds.length > 0
      ? await supabase.from('modules').select('id, course_id, title').in('id', moduleIds)
      : { data: [] };
    const moduleMap = new Map(
      ((modulesRaw ?? []) as { id: string; course_id: string; title: string }[])
        .map((m) => [m.id, m]),
    );
    const { data: lessonCoursesRaw } = await (async () => {
      const lessonCourseIds = Array.from(new Set(
        ((modulesRaw ?? []) as { course_id: string }[]).map((m) => m.course_id),
      ));
      return lessonCourseIds.length > 0
        ? supabase.from('courses').select('id, title, slug').in('id', lessonCourseIds)
        : { data: [] };
    })();
    const lessonCourseMap = new Map(
      ((lessonCoursesRaw ?? []) as { id: string; title: string; slug: string }[])
        .map((c) => [c.id, c]),
    );

    const courseMap = new Map(
      ((coursesRes.data ?? []) as { id: string; title: string; slug: string }[])
        .map((c) => [c.id, c]),
    );

    const categorySlugMap = new Map(
      ((categoriesRes.data ?? []) as { id: string; slug: string }[])
        .map((c) => [c.id, c.slug]),
    );

    // ── 6. Build feed items ──
    const items: FeedItem[] = [];

    // Admin posts (always included, pinned first)
    for (const p of adminPosts) {
      const authorName = profileMap.get(p.author_id) ?? 'AERABIM';
      items.push({
        id: `admin_post:${p.id}`,
        type: 'admin_post',
        postId: p.id,
        title: p.title,
        body: p.body,
        href: p.href,
        isPinned: p.is_pinned,
        createdAt: p.created_at,
        authorName,
        authorInitials: initials(authorName),
      } satisfies FeedItemAdminPost);
    }

    // Progress items
    for (const p of progresses) {
      if (hiddenSet.has(`progress:${p.id}`)) continue;
      const lesson = lessonMap.get(p.lesson_id);
      if (!lesson) continue;
      const module = moduleMap.get(lesson.module_id);
      if (!module) continue;
      const course = lessonCourseMap.get(module.course_id);
      if (!course) continue;
      const authorName = profileMap.get(p.user_id) ?? 'Utente';
      items.push({
        id: `progress:${p.id}`,
        type: 'progress',
        lessonTitle: lesson.title,
        courseTitle: course.title,
        courseSlug: course.slug,
        createdAt: p.completed_at,
        authorName,
        authorInitials: initials(authorName),
      } satisfies FeedItemProgress);
    }

    // Certificate items
    for (const c of certs) {
      if (hiddenSet.has(`certificate:${c.id}`)) continue;
      const course = courseMap.get(c.course_id);
      if (!course) continue;
      const authorName = profileMap.get(c.user_id) ?? 'Utente';
      items.push({
        id: `certificate:${c.id}`,
        type: 'certificate',
        courseTitle: course.title,
        courseSlug: course.slug,
        verifyCode: c.verify_code,
        createdAt: c.issued_at,
        authorName,
        authorInitials: initials(authorName),
      } satisfies FeedItemCertificate);
    }

    // Enrollment items
    for (const e of enrollments) {
      if (hiddenSet.has(`enrollment:${e.id}`)) continue;
      const course = courseMap.get(e.course_id);
      if (!course) continue;
      const authorName = profileMap.get(e.user_id) ?? 'Utente';
      items.push({
        id: `enrollment:${e.id}`,
        type: 'enrollment',
        courseTitle: course.title,
        courseSlug: course.slug,
        createdAt: e.created_at,
        authorName,
        authorInitials: initials(authorName),
      } satisfies FeedItemEnrollment);
    }

    // Discussion items
    for (const d of discussions) {
      if (hiddenSet.has(`discussion:${d.id}`)) continue;
      const categorySlug = categorySlugMap.get(d.category_id) ?? 'generale';
      const authorName = profileMap.get(d.author_id) ?? 'Utente';
      items.push({
        id: `discussion:${d.id}`,
        type: 'discussion',
        discussionTitle: d.title,
        discussionId: d.id,
        categorySlug,
        replyCount: d.reply_count,
        createdAt: d.created_at,
        authorName,
        authorInitials: initials(authorName),
      } satisfies FeedItemDiscussion);
    }

    // ── 7. Sort: pinned admin posts first, then chronological ──
    items.sort((a, b) => {
      const aPin = a.type === 'admin_post' && (a as FeedItemAdminPost).isPinned;
      const bPin = b.type === 'admin_post' && (b as FeedItemAdminPost).isPinned;
      if (aPin && !bPin) return -1;
      if (!aPin && bPin) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const paginated = items.slice(offset, offset + LIMIT);
    const hasMore = items.length > offset + LIMIT;

    // ── 8. Build sessions for sidebar ──
    type SessionRow = { id: string; type: string; title: string; host_name: string; scheduled_at: string; duration_min: number; status: string; max_participants: number | null };
    const bookingCounts = new Map<string, number>();
    const userBookings = new Set<string>();
    for (const b of (bookingsRes.data ?? []) as { session_id: string; user_id: string }[]) {
      bookingCounts.set(b.session_id, (bookingCounts.get(b.session_id) ?? 0) + 1);
      if (b.user_id === user.id) userBookings.add(b.session_id);
    }

    const sessions = ((sessionsRes.data ?? []) as SessionRow[]).map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      hostName: s.host_name,
      scheduledAt: s.scheduled_at,
      durationMin: s.duration_min,
      status: s.status,
      bookedCount: bookingCounts.get(s.id) ?? 0,
      maxParticipants: s.max_participants,
      isBooked: userBookings.has(s.id),
    }));

    return NextResponse.json({
      items: paginated,
      hasMore,
      nextOffset: offset + LIMIT,
      sessions,
    });
  } catch (err) {
    console.error('GET /api/feed error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
