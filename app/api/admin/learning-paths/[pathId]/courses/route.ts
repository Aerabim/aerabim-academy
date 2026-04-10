import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, AddLearningPathCoursePayload, LearningPathCourse } from '@/types';

interface RouteParams {
  params: { pathId: string };
}

type RawRow = {
  path_id: string;
  course_id: string;
  order_num: number;
  courses: {
    id: string;
    title: string;
    slug: string;
    status: string;
    thumbnail_url: string | null;
    duration_min: number | null;
    level: string;
    area: string;
  } | null;
};

function mapRow(r: RawRow): LearningPathCourse {
  return {
    pathId: r.path_id,
    courseId: r.course_id,
    orderNum: r.order_num,
    course: r.courses
      ? {
          id: r.courses.id,
          title: r.courses.title,
          slug: r.courses.slug,
          status: r.courses.status as import('@/types').CourseStatus,
          thumbnailUrl: r.courses.thumbnail_url,
          durationMin: r.courses.duration_min,
          level: r.courses.level as import('@/types').LevelCode,
          area: r.courses.area as import('@/types').AreaCode,
        }
      : {
          id: r.course_id,
          title: '(corso non trovato)',
          slug: '',
          status: 'archived' as import('@/types').CourseStatus,
          thumbnailUrl: null,
          durationMin: null,
          level: 'L1' as import('@/types').LevelCode,
          area: 'OB' as import('@/types').AreaCode,
        },
  };
}

/** GET /api/admin/learning-paths/[pathId]/courses — list courses in path */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { pathId } = params;

    const { data, error } = await admin
      .from('learning_path_courses')
      .select('path_id, course_id, order_num, courses(id, title, slug, status, thumbnail_url, duration_min, level, area)')
      .eq('path_id', pathId)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('GET learning_path_courses error:', error);
      return NextResponse.json(
        { error: 'Errore nel caricamento dei corsi del percorso.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const courses = ((data ?? []) as unknown as RawRow[]).map(mapRow);
    return NextResponse.json({ courses });
  } catch (err) {
    console.error('GET /api/admin/learning-paths/[pathId]/courses error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** POST /api/admin/learning-paths/[pathId]/courses — add a course to the path */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { pathId } = params;
    const body = (await req.json()) as AddLearningPathCoursePayload;

    if (!body.courseId?.trim()) {
      return NextResponse.json(
        { error: 'courseId è obbligatorio.' } satisfies ApiError,
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

    // Verify course exists
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

    // Prevent duplicate
    const { data: duplicate } = await admin
      .from('learning_path_courses')
      .select('course_id')
      .eq('path_id', pathId)
      .eq('course_id', body.courseId)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        { error: 'Questo corso è già presente nel percorso.' } satisfies ApiError,
        { status: 409 },
      );
    }

    // Compute next order_num
    const { data: last } = await admin
      .from('learning_path_courses')
      .select('order_num')
      .eq('path_id', pathId)
      .order('order_num', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = ((last as { order_num: number } | null)?.order_num ?? 0) + 1;

    const { error: insertErr } = await admin
      .from('learning_path_courses')
      .insert({ path_id: pathId, course_id: body.courseId, order_num: nextOrder });

    if (insertErr) {
      console.error('Insert learning_path_courses error:', insertErr);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiunta del corso al percorso.' } satisfies ApiError,
        { status: 500 },
      );
    }

    revalidatePath(`/admin/learning-paths/${pathId}`);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/learning-paths/[pathId]/courses error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
