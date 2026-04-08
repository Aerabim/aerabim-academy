export const dynamic = 'force-dynamic';

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { CourseTable } from '@/components/admin/courses/CourseTable';
import type { AdminCourseListItem } from '@/types';

export default async function AdminCoursesPage() {
  const admin = getSupabaseAdmin();
  let courses: AdminCourseListItem[] = [];

  if (admin) {
    try {
      const { data } = await admin
        .from('courses')
        .select('id, slug, title, area, level, price_single, is_free, status, is_featured, thumbnail_url, stripe_price_id, order_num, created_at, updated_at')
        .order('order_num', { ascending: true });

      const rawCourses = (data ?? []) as {
        id: string; slug: string; title: string; area: string; level: string;
        price_single: number; is_free: boolean; status: string; is_featured: boolean;
        thumbnail_url: string | null; stripe_price_id: string | null; created_at: string; updated_at: string | null;
      }[];

      const courseIds = rawCourses.map((c) => c.id);

      const [modulesRes, enrollmentsRes] = await Promise.all([
        admin
          .from('modules')
          .select('id, course_id, lessons(id)')
          .in('course_id', courseIds.length > 0 ? courseIds : ['']),
        admin
          .from('enrollments')
          .select('id, course_id')
          .in('course_id', courseIds.length > 0 ? courseIds : ['']),
      ]);

      type RawModule = { id: string; course_id: string; lessons: { id: string }[] };

      const modulesByCourse = new Map<string, number>();
      const lessonsByCourse = new Map<string, number>();
      for (const m of (modulesRes.data ?? []) as RawModule[]) {
        modulesByCourse.set(m.course_id, (modulesByCourse.get(m.course_id) ?? 0) + 1);
        lessonsByCourse.set(m.course_id, (lessonsByCourse.get(m.course_id) ?? 0) + (m.lessons?.length ?? 0));
      }

      const enrollsByCourse = new Map<string, number>();
      for (const e of (enrollmentsRes.data ?? []) as { id: string; course_id: string }[]) {
        enrollsByCourse.set(e.course_id, (enrollsByCourse.get(e.course_id) ?? 0) + 1);
      }

      courses = rawCourses.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        area: c.area as AdminCourseListItem['area'],
        level: c.level as AdminCourseListItem['level'],
        priceSingle: c.price_single,
        isFree: c.is_free,
        status: c.status as AdminCourseListItem['status'],
        isFeatured: c.is_featured ?? false,
        moduleCount: modulesByCourse.get(c.id) ?? 0,
        lessonCount: lessonsByCourse.get(c.id) ?? 0,
        enrolledCount: enrollsByCourse.get(c.id) ?? 0,
        thumbnailUrl: c.thumbnail_url,
        stripePriceId: c.stripe_price_id,
        createdAt: c.created_at,
        updatedAt: c.updated_at ?? c.created_at,
      }));
    } catch (err) {
      console.error('Admin courses page error:', err);
    }
  }

  return (
    <div className="p-6 lg:p-10 w-full">
      <div className="mb-6">
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">
          Gestione Corsi
        </h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">
          Crea, modifica e pubblica i corsi della piattaforma.
        </p>
      </div>
      <CourseTable courses={courses} />
    </div>
  );
}
