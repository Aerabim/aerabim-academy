import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { StatCard } from '@/components/admin/ui/StatCard';
import { CourseCompletionTable } from '@/components/admin/analytics/CourseCompletionTable';

export default async function AdminAnalyticsPage() {
  const admin = getSupabaseAdmin();

  let totalUsers = 0;
  let activeEnrollments = 0;
  let totalProgress = 0;
  let completedLessons = 0;
  let courseCompletions: { courseId: string; courseTitle: string; enrolledCount: number; completionRate: number }[] = [];

  if (admin) {
    try {
      const [usersRes, enrollRes, progressRes, completedRes] = await Promise.all([
        admin.from('profiles').select('id', { count: 'exact', head: true }),
        admin.from('enrollments').select('id', { count: 'exact', head: true }).or('expires_at.is.null,expires_at.gt.' + new Date().toISOString()),
        admin.from('progress').select('id', { count: 'exact', head: true }),
        admin.from('progress').select('id', { count: 'exact', head: true }).eq('completed', true),
      ]);

      totalUsers = usersRes.count ?? 0;
      activeEnrollments = enrollRes.count ?? 0;
      totalProgress = progressRes.count ?? 0;
      completedLessons = completedRes.count ?? 0;

      // Course completion rates
      const { data: courses } = await admin
        .from('courses')
        .select('id, title')
        .eq('is_published', true);

      if (courses && courses.length > 0) {
        const courseIds = (courses as { id: string; title: string }[]).map((c) => c.id);

        const { data: enrollments } = await admin
          .from('enrollments')
          .select('course_id')
          .in('course_id', courseIds)
          .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

        const enrollCountMap = new Map<string, number>();
        for (const e of (enrollments ?? []) as { course_id: string }[]) {
          enrollCountMap.set(e.course_id, (enrollCountMap.get(e.course_id) ?? 0) + 1);
        }

        courseCompletions = (courses as { id: string; title: string }[])
          .map((c) => ({
            courseId: c.id,
            courseTitle: c.title,
            enrolledCount: enrollCountMap.get(c.id) ?? 0,
            completionRate: 0, // Simplified — full completion calculation would need per-course lesson counting
          }))
          .filter((c) => c.enrolledCount > 0)
          .sort((a, b) => b.enrolledCount - a.enrolledCount);
      }
    } catch (err) {
      console.error('Analytics error:', err);
    }
  }

  const completionRate = totalProgress > 0
    ? Math.round((completedLessons / totalProgress) * 100)
    : 0;

  return (
    <div className="p-6 lg:p-10 w-full space-y-8">
      <div>
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">Analytics</h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">Panoramica delle metriche della piattaforma.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Utenti totali"
          value={totalUsers}
          accent="cyan"
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
        />
        <StatCard
          label="Iscrizioni attive"
          value={activeEnrollments}
          accent="emerald"
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>}
        />
        <StatCard
          label="Lezioni completate"
          value={completedLessons}
          accent="violet"
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>}
        />
        <StatCard
          label="Tasso completamento"
          value={`${completionRate}%`}
          accent="amber"
          icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>}
        />
      </div>

      {/* Course enrollments table */}
      {courseCompletions.length > 0 && (
        <section>
          <h2 className="text-[1rem] font-heading font-semibold text-text-primary mb-4">
            Corsi per iscrizioni attive
          </h2>
          <CourseCompletionTable courses={courseCompletions} />
        </section>
      )}
    </div>
  );
}
