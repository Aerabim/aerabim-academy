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
        .select('id, slug, title, area, level, price_single, is_free, status, created_at')
        .order('created_at', { ascending: false });

      const rawCourses = (data ?? []) as {
        id: string; slug: string; title: string; area: string; level: string;
        price_single: number; is_free: boolean; status: string; created_at: string;
      }[];

      const courseIds = rawCourses.map((c) => c.id);

      const [modulesRes, enrollmentsRes] = await Promise.all([
        admin.from('modules').select('id, course_id').in('course_id', courseIds.length > 0 ? courseIds : ['']),
        admin.from('enrollments').select('id, course_id').in('course_id', courseIds.length > 0 ? courseIds : ['']),
      ]);

      const modulesByCourse = new Map<string, number>();
      for (const m of (modulesRes.data ?? []) as { id: string; course_id: string }[]) {
        modulesByCourse.set(m.course_id, (modulesByCourse.get(m.course_id) ?? 0) + 1);
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
        moduleCount: modulesByCourse.get(c.id) ?? 0,
        lessonCount: 0,
        enrolledCount: enrollsByCourse.get(c.id) ?? 0,
        createdAt: c.created_at,
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
