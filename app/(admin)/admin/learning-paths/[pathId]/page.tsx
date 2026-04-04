export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { LearningPathForm } from '@/components/admin/learning-paths/LearningPathForm';
import { StepList } from '@/components/admin/learning-paths/StepList';
import type { LearningPath, LearningPathStepDisplay, CourseStatus, AreaCode, LevelCode } from '@/types';

interface PageProps {
  params: { pathId: string };
}

type RawStep = {
  id: string; path_id: string; order_num: number;
  step_type: 'course' | 'video' | 'material';
  title: string | null; description: string | null; is_required: boolean; created_at: string;
  course_id: string | null;
  mux_playback_id: string | null; mux_asset_id: string | null; duration_sec: number | null;
  material_url: string | null; material_type: 'pdf' | 'link' | null;
  courses: {
    id: string; title: string; slug: string; status: string;
    thumbnail_url: string | null; duration_min: number | null; level: string; area: string;
  } | null;
};

function mapStep(s: RawStep): LearningPathStepDisplay {
  const base = {
    id: s.id, pathId: s.path_id, orderNum: s.order_num,
    title: s.title, description: s.description,
    isRequired: s.is_required, createdAt: s.created_at,
  };
  if (s.step_type === 'course') {
    return {
      ...base, stepType: 'course', courseId: s.course_id!,
      course: s.courses
        ? {
            id: s.courses.id, title: s.courses.title, slug: s.courses.slug,
            status: s.courses.status as CourseStatus,
            thumbnail_url: s.courses.thumbnail_url,
            duration_min: s.courses.duration_min,
            level: s.courses.level as LevelCode,
            area: s.courses.area as AreaCode,
          }
        : {
            id: s.course_id!, title: '(corso non trovato)', slug: '',
            status: 'archived' as CourseStatus,
            thumbnail_url: null, duration_min: null,
            level: 'L1' as LevelCode, area: 'OB' as AreaCode,
          },
    };
  }
  if (s.step_type === 'video') {
    return {
      ...base, stepType: 'video',
      muxPlaybackId: s.mux_playback_id!,
      muxAssetId: s.mux_asset_id, durationSec: s.duration_sec,
    };
  }
  return {
    ...base, stepType: 'material',
    materialUrl: s.material_url!, materialType: s.material_type!,
  };
}

export default async function EditLearningPathPage({ params }: PageProps) {
  const admin = getSupabaseAdmin();
  if (!admin) notFound();

  const [pathRes, stepsRes] = await Promise.all([
    admin
      .from('learning_paths')
      .select('*')
      .eq('id', params.pathId)
      .single(),
    admin
      .from('learning_path_steps')
      .select(`
        id, path_id, order_num, step_type, title, description,
        is_required, created_at, course_id,
        mux_playback_id, mux_asset_id, duration_sec,
        material_url, material_type,
        courses(id, title, slug, status, thumbnail_url, duration_min, level, area)
      `)
      .eq('path_id', params.pathId)
      .order('order_num', { ascending: true }),
  ]);

  if (pathRes.error || !pathRes.data) notFound();

  const path = pathRes.data as unknown as LearningPath;
  const steps = ((stepsRes.data ?? []) as unknown as RawStep[]).map(mapStep);

  return (
    <div className="p-6 lg:p-10 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">
          {path.title}
        </h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">
          Modifica metadati e costruisci i passi del percorso.
        </p>
      </div>

      <div className="space-y-10">
        {/* Metadata section */}
        <section>
          <h2 className="text-[0.88rem] font-semibold text-text-primary mb-4 pb-2 border-b border-border-subtle">
            Metadati
          </h2>
          <LearningPathForm path={path} />
        </section>

        {/* Steps section */}
        <section>
          <h2 className="text-[0.88rem] font-semibold text-text-primary mb-4 pb-2 border-b border-border-subtle">
            Passi del percorso
            <span className="ml-2 text-[0.75rem] font-normal text-text-muted">
              ({steps.length} {steps.length === 1 ? 'passo' : 'passi'})
            </span>
          </h2>
          <StepList pathId={params.pathId} initialSteps={steps} />
        </section>
      </div>
    </div>
  );
}
