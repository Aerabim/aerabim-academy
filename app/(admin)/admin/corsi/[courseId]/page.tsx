export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAdminCourseDetail, getAdminCourseStats, getAdminCourseActivity } from '@/lib/admin/queries';
import { CourseForm } from '@/components/admin/courses/CourseForm';
import { CourseFormFooter } from '@/components/admin/courses/CourseFormFooter';
import { ModuleManager } from '@/components/admin/courses/ModuleManager';
import { CourseMaterialsManager } from '@/components/admin/courses/CourseMaterialsManager';
import { QuizEditor } from '@/components/admin/courses/QuizEditor';
import { PrivateAccessManager } from '@/components/admin/courses/PrivateAccessManager';
import { CourseTabsProvider, CourseNavTabs } from '@/components/admin/courses/CourseNavTabs';
import type { CourseNavTab } from '@/components/admin/courses/CourseNavTabs';
import { CourseTabPanel } from '@/components/admin/courses/CourseTabPanel';
import { CourseActivityFeed } from '@/components/admin/courses/CourseActivityFeed';
import { Badge } from '@/components/ui/Badge';
import type { CourseMaterial } from '@/types';

interface PageProps {
  params: { courseId: string };
}

function formatDuration(totalSec: number): string {
  if (totalSec === 0) return '—';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default async function EditCoursePage({ params }: PageProps) {
  const admin = getSupabaseAdmin();
  if (!admin) redirect('/admin/corsi');

  const detail = await getAdminCourseDetail(admin, params.courseId);
  if (!detail) redirect('/admin/corsi');

  const { course, modules } = detail;

  // Derive lesson list from already-fetched modules
  const allLessons = modules.flatMap((m) => m.lessons);
  const lessonIds = allLessons.map((l) => l.id);
  const totalDurationSec = allLessons.reduce((sum, l) => sum + (l.durationSec ?? 0), 0);

  // Fetch stats, materials and activity log in parallel
  const [
    { enrolledCount, completionCount },
    { data: materialsRaw },
    activityItems,
  ] = await Promise.all([
    getAdminCourseStats(admin, params.courseId, lessonIds),
    admin
      .from('materials')
      .select('id, course_id, title, file_url, file_name, file_type, file_size, order_num, created_at')
      .eq('course_id', params.courseId)
      .order('order_num', { ascending: true }),
    getAdminCourseActivity(admin, params.courseId, course.created_at),
  ]);

  const materials: CourseMaterial[] = (materialsRaw ?? []).map((m: {
    id: string; course_id: string; title: string; file_url: string;
    file_name: string; file_type: string; file_size: number | null;
    order_num: number; created_at: string;
  }) => ({
    id: m.id,
    courseId: m.course_id,
    title: m.title,
    fileUrl: m.file_url,
    fileName: m.file_name,
    fileType: m.file_type,
    fileSize: m.file_size,
    orderNum: m.order_num,
    createdAt: m.created_at,
  }));

  // Find quiz lessons for quiz editors
  const quizLessons = modules.flatMap((m) =>
    m.lessons
      .filter((l) => l.type === 'quiz')
      .map((l) => ({ ...l, moduleTitle: m.title })),
  );

  // Build nav tabs — only include sections that are actually rendered
  const navTabs: CourseNavTab[] = [
    { id: 'section-dettagli', label: 'Dettagli' },
    ...(course.status === 'private' ? [{ id: 'section-accesso', label: 'Accesso privato' }] : []),
    { id: 'section-moduli', label: 'Moduli e lezioni' },
    { id: 'section-materiali', label: 'Materiali' },
    ...(quizLessons.length > 0 ? [{ id: 'section-quiz', label: 'Quiz' }] : []),
    { id: 'section-attivita', label: `Attività${activityItems.filter((i) => i.type === 'enrollment').length > 0 ? ` (${activityItems.filter((i) => i.type === 'enrollment').length})` : ''}` },
  ];

  return (
    <div className="p-6 lg:p-10 w-full flex flex-col min-h-[calc(100vh-62px)]">
      {/* Header — always visible */}
      <div className="space-y-3 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">
              {course.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[0.78rem] text-text-muted">/{course.slug}</span>
              <Badge variant={course.status === 'published' ? 'emerald' : course.status === 'hidden' ? 'amber' : course.status === 'archived' ? 'rose' : course.status === 'private' ? 'violet' : 'amber'}>
                {course.status === 'published' ? 'Pubblicato' : course.status === 'hidden' ? 'Nascosto' : course.status === 'archived' ? 'Archiviato' : course.status === 'private' ? 'Privato' : 'Bozza'}
              </Badge>
              {course.is_featured && (
                <Badge variant="cyan">In evidenza</Badge>
              )}
            </div>
          </div>
          {course.status === 'published' && (
            <a
              href={`/catalogo-corsi/${course.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[0.78rem] font-medium text-text-secondary border border-border-subtle rounded-md hover:text-text-primary hover:border-border-default transition-colors shrink-0"
            >
              Vedi nel catalogo
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="opacity-60">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </div>

        {/* Stats pills */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-2 border border-border-subtle rounded-md">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-text-muted shrink-0">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-[0.8rem] font-semibold text-text-primary tabular-nums">{enrolledCount}</span>
            <span className="text-[0.72rem] text-text-muted">{enrolledCount === 1 ? 'iscritto' : 'iscritti'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-2 border border-border-subtle rounded-md">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-text-muted shrink-0">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <span className="text-[0.8rem] font-semibold text-text-primary tabular-nums">{allLessons.length}</span>
            <span className="text-[0.72rem] text-text-muted">{allLessons.length === 1 ? 'lezione' : 'lezioni'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-2 border border-border-subtle rounded-md">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-text-muted shrink-0">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
            <span className="text-[0.8rem] font-semibold text-text-primary tabular-nums">{formatDuration(totalDurationSec)}</span>
            <span className="text-[0.72rem] text-text-muted">durata</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-2 border border-border-subtle rounded-md">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-text-muted shrink-0">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
            </svg>
            <span className="text-[0.8rem] font-semibold text-text-primary tabular-nums">{completionCount}</span>
            <span className="text-[0.72rem] text-text-muted">{completionCount === 1 ? 'completamento' : 'completamenti'}</span>
          </div>
        </div>
      </div>

      {/* Tab navigation + panels */}
      <CourseTabsProvider defaultTab="section-dettagli">
        <CourseNavTabs tabs={navTabs} />
        <div className="flex-1">

        {/* Dettagli */}
        <CourseTabPanel id="section-dettagli">
          <section>
            <h2 className="text-[1rem] font-heading font-semibold text-text-primary mb-4">
              Dettagli corso
            </h2>
            <CourseForm course={course} computedDurationSec={totalDurationSec} />
          </section>
        </CourseTabPanel>

        {/* Accesso privato */}
        {course.status === 'private' && (
          <CourseTabPanel id="section-accesso">
            <section>
              <PrivateAccessManager courseId={course.id} />
            </section>
          </CourseTabPanel>
        )}

        {/* Moduli e lezioni */}
        <CourseTabPanel id="section-moduli">
          <section>
            <ModuleManager courseId={course.id} modules={modules} />
          </section>
        </CourseTabPanel>

        {/* Materiali */}
        <CourseTabPanel id="section-materiali">
          <section className="bg-surface-1 border border-border-subtle rounded-lg p-5">
            <CourseMaterialsManager courseId={course.id} initialMaterials={materials} />
          </section>
        </CourseTabPanel>

        {/* Quiz */}
        {quizLessons.length > 0 && (
          <CourseTabPanel id="section-quiz">
            <section className="space-y-6">
              <h2 className="text-[1rem] font-heading font-semibold text-text-primary">
                Gestione Quiz
              </h2>
              {quizLessons.map((lesson) => (
                <div key={lesson.id} className="bg-surface-1 border border-border-subtle rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="amber">Quiz</Badge>
                    <span className="text-[0.82rem] font-medium text-text-primary">{lesson.title}</span>
                    <span className="text-[0.7rem] text-text-muted">({lesson.moduleTitle})</span>
                  </div>
                  <QuizEditor courseId={course.id} lessonId={lesson.id} />
                </div>
              ))}
            </section>
          </CourseTabPanel>
        )}

        {/* Attività */}
        <CourseTabPanel id="section-attivita">
          <section>
            <CourseActivityFeed items={activityItems} />
          </section>
        </CourseTabPanel>

        </div>
        <CourseFormFooter isEditing courseId={course.id} currentStatus={course.status} />
      </CourseTabsProvider>
    </div>
  );
}
