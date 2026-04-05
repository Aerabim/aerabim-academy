import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { PathDetail } from '@/components/learning-paths/PathDetail';
import type {
  LearningPath,
  LearningPathStepDisplay,
  CourseStatus,
  AreaCode,
  LevelCode,
} from '@/types';

interface PageProps {
  params: { slug: string };
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
            id: s.course_id!, title: '(corso non disponibile)', slug: '',
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

export default async function LearningPathDetailPage({ params }: PageProps) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = getSupabaseAdmin();

  if (!admin) notFound();

  // Fetch path by slug (only published for regular users)
  const { data: pathData, error: pathError } = await admin
    .from('learning_paths')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single();

  if (pathError || !pathData) notFound();

  const path = pathData as unknown as LearningPath;

  // Fetch steps with course join
  const { data: stepsData } = await admin
    .from('learning_path_steps')
    .select(`
      id, path_id, order_num, step_type, title, description,
      is_required, created_at, course_id,
      mux_playback_id, mux_asset_id, duration_sec,
      material_url, material_type,
      courses(id, title, slug, status, thumbnail_url, duration_min, level, area)
    `)
    .eq('path_id', path.id)
    .order('order_num', { ascending: true });

  const steps = ((stepsData ?? []) as unknown as RawStep[]).map(mapStep);

  // Fetch user enrollments for the courses in this path
  const enrolledCourseIds = new Set<string>();
  let isPathEnrolled = false;

  if (user) {
    const courseIds = steps
      .filter((s) => s.stepType === 'course')
      .map((s) => (s.stepType === 'course' ? s.courseId : ''))
      .filter(Boolean);

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

  return (
    <div className="w-full px-6 lg:px-9 pt-3 pb-7">
      <PathDetail
        path={path}
        steps={steps}
        enrolledCourseIds={enrolledCourseIds}
        isPathEnrolled={isPathEnrolled}
      />
    </div>
  );
}
