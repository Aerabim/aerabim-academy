import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { PathDetail } from '@/components/learning-paths/PathDetail';
import type { LearningPath, LearningPathCourse, CourseStatus, AreaCode, LevelCode, DiscountInfo, PathDiscount } from '@/types';

interface PageProps {
  params: { slug: string };
}

type RawCourseRow = {
  path_id: string; course_id: string; order_num: number;
  courses: {
    id: string; title: string; slug: string; status: string;
    thumbnail_url: string | null; duration_min: number | null; level: string; area: string;
  } | null;
};

function mapCourse(r: RawCourseRow): LearningPathCourse {
  return {
    pathId: r.path_id,
    courseId: r.course_id,
    orderNum: r.order_num,
    course: r.courses
      ? {
          id: r.courses.id,
          title: r.courses.title,
          slug: r.courses.slug,
          status: r.courses.status as CourseStatus,
          thumbnailUrl: r.courses.thumbnail_url,
          durationMin: r.courses.duration_min,
          level: r.courses.level as LevelCode,
          area: r.courses.area as AreaCode,
        }
      : {
          id: r.course_id,
          title: '(corso non disponibile)',
          slug: '',
          status: 'archived' as CourseStatus,
          thumbnailUrl: null,
          durationMin: null,
          level: 'L1' as LevelCode,
          area: 'OB' as AreaCode,
        },
  };
}

export default async function LearningPathDetailPage({ params }: PageProps) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = getSupabaseAdmin();

  if (!admin) notFound();

  // Fetch path by slug (only published)
  const { data: pathData, error: pathError } = await admin
    .from('learning_paths')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (pathError || !pathData) notFound();

  const path = pathData as unknown as LearningPath;
  const priceInCents = (path as unknown as { price_single: number }).price_single ?? 0;

  // Fetch courses in path
  const { data: coursesData } = await admin
    .from('learning_path_courses')
    .select('path_id, course_id, order_num, courses(id, title, slug, status, thumbnail_url, duration_min, level, area)')
    .eq('path_id', path.id)
    .order('order_num', { ascending: true });

  const courses = ((coursesData ?? []) as unknown as RawCourseRow[]).map(mapCourse);

  // Fetch user enrollments
  const enrolledCourseIds = new Set<string>();
  let isPathEnrolled = false;

  if (user) {
    const courseIds = courses.map((c) => c.courseId).filter(Boolean);

    const [enrollResult, pathEnrollResult] = await Promise.all([
      courseIds.length > 0
        ? admin.from('enrollments').select('course_id').eq('user_id', user.id).in('course_id', courseIds)
        : Promise.resolve({ data: [] }),
      admin.from('learning_path_enrollments').select('id').eq('user_id', user.id).eq('path_id', path.id).maybeSingle(),
    ]);

    for (const e of (enrollResult.data ?? []) as { course_id: string }[]) {
      enrolledCourseIds.add(e.course_id);
    }
    isPathEnrolled = !!pathEnrollResult.data;
  }

  // ── Calcolo sconto ────────────────────────────────────────────
  let discountInfo: DiscountInfo | undefined;

  if (!isPathEnrolled && priceInCents > 0) {
    const now = new Date().toISOString();

    // 1. Controlla promozioni attive (globali o per questo percorso)
    const { data: discountsData } = await admin
      .from('path_discounts')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .or(`scope.eq.all,path_id.eq.${path.id}`)
      .order('discount_pct', { ascending: false })
      .limit(1);

    const activeDiscount = (discountsData ?? [])[0] as PathDiscount | undefined;

    // 2. Controlla abbonamento PRO dell'utente
    const proDiscountPct = (path as unknown as { pro_discount_pct: number }).pro_discount_pct ?? 0;
    let isProUser = false;

    if (user && proDiscountPct > 0) {
      const { data: subData } = await admin
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      isProUser = !!subData;
    }

    // 3. Applica lo sconto maggiore
    const proDiscount = isProUser ? proDiscountPct : 0;
    const promoDiscount = activeDiscount?.discount_pct ?? 0;

    if (proDiscount > 0 || promoDiscount > 0) {
      const bestPct = Math.max(proDiscount, promoDiscount);
      const discountedPrice = Math.round(priceInCents * (1 - bestPct / 100));

      let label: string;
      let badgeColor: DiscountInfo['badgeColor'];

      if (promoDiscount >= proDiscount && activeDiscount) {
        label = activeDiscount.name;
        badgeColor = 'rose';
      } else {
        label = 'PRO';
        badgeColor = 'amber';
      }

      discountInfo = { discountedPrice, discountPct: bestPct, label, badgeColor };
    }
  }

  return (
    <div className="w-full px-6 lg:px-9 pt-3 pb-7">
      <PathDetail
        path={path}
        courses={courses}
        enrolledCourseIds={enrolledCourseIds}
        isPathEnrolled={isPathEnrolled}
        discountInfo={discountInfo}
      />
    </div>
  );
}
