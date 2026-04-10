export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAdminLearningPathStats, getAdminLearningPathActivity } from '@/lib/admin/queries';
import { LearningPathForm } from '@/components/admin/learning-paths/LearningPathForm';
import { CourseList } from '@/components/admin/learning-paths/CourseList';
import { PathMaterialList } from '@/components/admin/learning-paths/PathMaterialList';
import { LearningPathActivityFeed } from '@/components/admin/learning-paths/LearningPathActivityFeed';
import { LearningPathTabsProvider, LearningPathNavTabs } from '@/components/admin/learning-paths/LearningPathNavTabs';
import type { LearningPathNavTab } from '@/components/admin/learning-paths/LearningPathNavTabs';
import { LearningPathTabPanel } from '@/components/admin/learning-paths/LearningPathTabPanel';
import { LearningPathFormFooter } from '@/components/admin/learning-paths/LearningPathFormFooter';
import { Badge } from '@/components/ui/Badge';
import { timeAgo } from '@/lib/utils';
import type {
  LearningPath, LearningPathCourse, LearningPathMaterial,
  LearningPathStatus, CourseStatus, AreaCode, LevelCode,
} from '@/types';

interface PageProps {
  params: { pathId: string };
}

type RawCourseRow = {
  path_id: string; course_id: string; order_num: number;
  courses: {
    id: string; title: string; slug: string; status: string;
    thumbnail_url: string | null; duration_min: number | null; level: string; area: string;
  } | null;
};

type RawMaterialRow = {
  id: string; path_id: string; title: string; url: string;
  material_type: 'pdf' | 'link'; order_num: number; created_at: string;
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
          title: '(corso non trovato)',
          slug: '',
          status: 'archived' as CourseStatus,
          thumbnailUrl: null,
          durationMin: null,
          level: 'L1' as LevelCode,
          area: 'OB' as AreaCode,
        },
  };
}

const STATUS_BADGE_VARIANT: Record<LearningPathStatus, 'emerald' | 'amber' | 'rose' | 'violet' | 'default'> = {
  published: 'emerald',
  hidden:    'amber',
  archived:  'rose',
  private:   'violet',
  draft:     'default',
};

const STATUS_LABEL: Record<LearningPathStatus, string> = {
  published: 'Pubblicato',
  hidden:    'Nascosto',
  archived:  'Archiviato',
  private:   'Privato',
  draft:     'Bozza',
};

export default async function EditLearningPathPage({ params }: PageProps) {
  const admin = getSupabaseAdmin();
  if (!admin) notFound();

  const [pathRes, coursesRes, materialsRes] = await Promise.all([
    admin
      .from('learning_paths')
      .select('*')
      .eq('id', params.pathId)
      .single(),
    admin
      .from('learning_path_courses')
      .select('path_id, course_id, order_num, courses(id, title, slug, status, thumbnail_url, duration_min, level, area)')
      .eq('path_id', params.pathId)
      .order('order_num', { ascending: true }),
    admin
      .from('learning_path_materials')
      .select('id, path_id, title, url, material_type, order_num, created_at')
      .eq('path_id', params.pathId)
      .order('order_num', { ascending: true }),
  ]);

  if (pathRes.error || !pathRes.data) notFound();

  const path = pathRes.data as unknown as LearningPath;
  const courses = ((coursesRes.data ?? []) as unknown as RawCourseRow[]).map(mapCourse);
  const materials: LearningPathMaterial[] = ((materialsRes.data ?? []) as RawMaterialRow[]).map((m) => ({
    id: m.id,
    pathId: m.path_id,
    title: m.title,
    url: m.url,
    materialType: m.material_type,
    orderNum: m.order_num,
    createdAt: m.created_at,
  }));

  const [stats, activityItems] = await Promise.all([
    getAdminLearningPathStats(admin, params.pathId),
    getAdminLearningPathActivity(admin, params.pathId, path.created_at),
  ]);

  const enrollmentCount = activityItems.filter((i) => i.type === 'enrollment').length;

  const navTabs: LearningPathNavTab[] = [
    { id: 'section-dettagli',  label: 'Dettagli' },
    { id: 'section-corsi',     label: `Corsi${courses.length > 0 ? ` (${courses.length})` : ''}` },
    { id: 'section-materiali', label: `Materiali${materials.length > 0 ? ` (${materials.length})` : ''}` },
    { id: 'section-attivita',  label: `Attività${enrollmentCount > 0 ? ` (${enrollmentCount})` : ''}` },
  ];

  return (
    <div className="p-6 lg:p-10 w-full flex flex-col min-h-[calc(100vh-62px)]">
      {/* Header */}
      <div className="space-y-3 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">
              {path.title}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[0.78rem] text-text-muted">/{path.slug}</span>
              <Badge variant={STATUS_BADGE_VARIANT[path.status as LearningPathStatus] ?? 'default'}>
                {STATUS_LABEL[path.status as LearningPathStatus] ?? path.status}
              </Badge>
              <span className="flex items-center gap-1 text-[0.72rem] text-text-muted">
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="shrink-0">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                Modificato {timeAgo(path.updated_at)}
              </span>
            </div>
          </div>
          {path.status === 'published' && (
            <a
              href={`/learning-paths/${path.slug}`}
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
            <span className="text-[0.8rem] font-semibold text-text-primary tabular-nums">{stats.enrolledCount}</span>
            <span className="text-[0.72rem] text-text-muted">{stats.enrolledCount === 1 ? 'iscritto' : 'iscritti'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-2 border border-border-subtle rounded-md">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-text-muted shrink-0">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-[0.8rem] font-semibold text-text-primary tabular-nums">{stats.courseCount}</span>
            <span className="text-[0.72rem] text-text-muted">{stats.courseCount === 1 ? 'corso' : 'corsi'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-2 border border-border-subtle rounded-md">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-text-muted shrink-0">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
            </svg>
            <span className="text-[0.8rem] font-semibold text-text-primary tabular-nums">{stats.completionCount}</span>
            <span className="text-[0.72rem] text-text-muted">{stats.completionCount === 1 ? 'completamento' : 'completamenti'}</span>
          </div>
          {path.estimated_hours && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-2 border border-border-subtle rounded-md">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-text-muted shrink-0">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              <span className="text-[0.8rem] font-semibold text-text-primary tabular-nums">{path.estimated_hours}h</span>
              <span className="text-[0.72rem] text-text-muted">stimate</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab navigation + panels */}
      <LearningPathTabsProvider defaultTab="section-dettagli">
        <LearningPathNavTabs tabs={navTabs} />
        <div className="flex-1">

          {/* Dettagli */}
          <LearningPathTabPanel id="section-dettagli">
            <section>
              <h2 className="text-[1rem] font-heading font-semibold text-text-primary mb-4">
                Dettagli percorso
              </h2>
              <LearningPathForm path={path} />
            </section>
          </LearningPathTabPanel>

          {/* Corsi */}
          <LearningPathTabPanel id="section-corsi">
            <section>
              <h2 className="text-[1rem] font-heading font-semibold text-text-primary mb-4">
                Corsi del percorso
              </h2>
              <CourseList pathId={params.pathId} initialCourses={courses} />
            </section>
          </LearningPathTabPanel>

          {/* Materiali */}
          <LearningPathTabPanel id="section-materiali">
            <section>
              <h2 className="text-[1rem] font-heading font-semibold text-text-primary mb-4">
                Materiali del percorso
              </h2>
              <p className="text-[0.82rem] text-text-muted mb-4">
                Risorse aggiuntive (PDF, link) rese disponibili agli iscritti al percorso.
              </p>
              <PathMaterialList pathId={params.pathId} initialMaterials={materials} />
            </section>
          </LearningPathTabPanel>

          {/* Attività */}
          <LearningPathTabPanel id="section-attivita">
            <section>
              <LearningPathActivityFeed items={activityItems} />
            </section>
          </LearningPathTabPanel>

        </div>
        <LearningPathFormFooter
          isEditing
          pathId={params.pathId}
          currentStatus={path.status as LearningPathStatus}
        />
      </LearningPathTabsProvider>
    </div>
  );
}
