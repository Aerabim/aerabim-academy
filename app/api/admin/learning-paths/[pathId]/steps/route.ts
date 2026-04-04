import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, AddLearningPathStepPayload, LearningPathStepDisplay } from '@/types';

interface RouteParams {
  params: { pathId: string };
}

type RawStep = {
  id: string;
  path_id: string;
  order_num: number;
  step_type: 'course' | 'video' | 'material';
  title: string | null;
  description: string | null;
  is_required: boolean;
  created_at: string;
  course_id: string | null;
  mux_playback_id: string | null;
  mux_asset_id: string | null;
  duration_sec: number | null;
  material_url: string | null;
  material_type: 'pdf' | 'link' | null;
  courses: {
    id: string; title: string; slug: string;
    status: string; thumbnail_url: string | null;
    duration_min: number | null; level: string; area: string;
  } | null;
};

function mapStepToDisplay(s: RawStep): LearningPathStepDisplay {
  const base = {
    id: s.id,
    pathId: s.path_id,
    orderNum: s.order_num,
    title: s.title,
    description: s.description,
    isRequired: s.is_required,
    createdAt: s.created_at,
  };

  if (s.step_type === 'course') {
    const courseData = s.courses
      ? {
          id: s.courses.id,
          title: s.courses.title,
          slug: s.courses.slug,
          status: s.courses.status as import('@/types').CourseStatus,
          thumbnail_url: s.courses.thumbnail_url,
          duration_min: s.courses.duration_min,
          level: s.courses.level as import('@/types').LevelCode,
          area: s.courses.area as import('@/types').AreaCode,
        }
      : {
          id: s.course_id!,
          title: '(corso non trovato)',
          slug: '',
          status: 'archived' as import('@/types').CourseStatus,
          thumbnail_url: null,
          duration_min: null,
          level: 'L1' as import('@/types').LevelCode,
          area: 'OB' as import('@/types').AreaCode,
        };

    return { ...base, stepType: 'course', courseId: s.course_id!, course: courseData };
  }

  if (s.step_type === 'video') {
    return {
      ...base,
      stepType: 'video',
      muxPlaybackId: s.mux_playback_id!,
      muxAssetId: s.mux_asset_id,
      durationSec: s.duration_sec,
    };
  }

  return {
    ...base,
    stepType: 'material',
    materialUrl: s.material_url!,
    materialType: s.material_type!,
  };
}

/** GET /api/admin/learning-paths/[pathId]/steps — list steps with course join */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { pathId } = params;

    const { data, error } = await admin
      .from('learning_path_steps')
      .select(`
        id, path_id, order_num, step_type, title, description,
        is_required, created_at, course_id,
        mux_playback_id, mux_asset_id, duration_sec,
        material_url, material_type,
        courses(id, title, slug, status, thumbnail_url, duration_min, level, area)
      `)
      .eq('path_id', pathId)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('GET steps error:', error);
      return NextResponse.json(
        { error: 'Errore nel caricamento dei passi.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const steps = (data ?? []) as unknown as RawStep[];
    return NextResponse.json({ steps: steps.map(mapStepToDisplay) });
  } catch (err) {
    console.error('GET /api/admin/learning-paths/[pathId]/steps error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** POST /api/admin/learning-paths/[pathId]/steps — add a step to a path */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { pathId } = params;
    const body = (await req.json()) as AddLearningPathStepPayload;

    if (!body.stepType || !['course', 'video', 'material'].includes(body.stepType)) {
      return NextResponse.json(
        { error: 'stepType deve essere "course", "video" o "material".' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Type-specific validation
    if (body.stepType === 'course' && !body.courseId) {
      return NextResponse.json(
        { error: 'courseId è obbligatorio per uno step di tipo "course".' } satisfies ApiError,
        { status: 400 },
      );
    }
    if (body.stepType === 'video' && !body.muxPlaybackId) {
      return NextResponse.json(
        { error: 'muxPlaybackId è obbligatorio per uno step di tipo "video".' } satisfies ApiError,
        { status: 400 },
      );
    }
    if (body.stepType === 'material' && (!body.materialUrl || !body.materialType)) {
      return NextResponse.json(
        { error: 'materialUrl e materialType sono obbligatori per uno step di tipo "material".' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Verify path exists
    const { data: pathRow } = await admin
      .from('learning_paths')
      .select('id')
      .eq('id', pathId)
      .maybeSingle();

    if (!pathRow) {
      return NextResponse.json(
        { error: 'Percorso non trovato.' } satisfies ApiError,
        { status: 404 },
      );
    }

    // For course steps, verify the course exists
    if (body.stepType === 'course') {
      const { data: courseRow } = await admin
        .from('courses')
        .select('id')
        .eq('id', body.courseId)
        .maybeSingle();

      if (!courseRow) {
        return NextResponse.json(
          { error: 'Corso non trovato.' } satisfies ApiError,
          { status: 404 },
        );
      }

      // Prevent duplicate course in the same path
      const { data: duplicate } = await admin
        .from('learning_path_steps')
        .select('id')
        .eq('path_id', pathId)
        .eq('course_id', body.courseId)
        .maybeSingle();

      if (duplicate) {
        return NextResponse.json(
          { error: 'Questo corso è già presente nel percorso.' } satisfies ApiError,
          { status: 409 },
        );
      }
    }

    // Compute next order_num
    const { data: last } = await admin
      .from('learning_path_steps')
      .select('order_num')
      .eq('path_id', pathId)
      .order('order_num', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = ((last as { order_num: number } | null)?.order_num ?? 0) + 1;

    const insertData: Record<string, unknown> = {
      path_id: pathId,
      order_num: nextOrder,
      step_type: body.stepType,
      title: body.title ?? null,
      description: body.description ?? null,
      is_required: body.isRequired ?? true,
    };

    if (body.stepType === 'course') {
      insertData.course_id = body.courseId;
    } else if (body.stepType === 'video') {
      insertData.mux_playback_id = body.muxPlaybackId;
      insertData.mux_asset_id = body.muxAssetId ?? null;
      insertData.duration_sec = body.durationSec ?? null;
    } else {
      insertData.material_url = body.materialUrl;
      insertData.material_type = body.materialType;
    }

    const { data: step, error } = await admin
      .from('learning_path_steps')
      .insert(insertData)
      .select('id, order_num')
      .single();

    if (error || !step) {
      console.error('Insert step error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiunta del passo.' } satisfies ApiError,
        { status: 500 },
      );
    }

    revalidatePath(`/admin/learning-paths/${pathId}`);
    return NextResponse.json({ step }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/learning-paths/[pathId]/steps error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
