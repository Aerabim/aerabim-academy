import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, CreateLessonPayload } from '@/types';

interface RouteParams {
  params: { courseId: string };
}

/** POST /api/admin/courses/[courseId]/lessons — create a lesson */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = (await req.json()) as CreateLessonPayload;

    if (!body.moduleId || !body.title || !body.type) {
      return NextResponse.json(
        { error: 'Campi obbligatori: moduleId, title, type.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Verify module belongs to this course
    const { data: mod } = await admin
      .from('modules')
      .select('id')
      .eq('id', body.moduleId)
      .eq('course_id', params.courseId)
      .maybeSingle();

    if (!mod) {
      return NextResponse.json(
        { error: 'Modulo non trovato per questo corso.' } satisfies ApiError,
        { status: 404 },
      );
    }

    // Get next order_num within the module
    const { data: lastLesson } = await admin
      .from('lessons')
      .select('order_num')
      .eq('module_id', body.moduleId)
      .order('order_num', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = ((lastLesson as { order_num: number } | null)?.order_num ?? 0) + 1;

    const { data: lesson, error } = await admin
      .from('lessons')
      .insert({
        module_id: body.moduleId,
        title: body.title,
        type: body.type,
        order_num: nextOrder,
        is_preview: body.isPreview ?? false,
      })
      .select('id, module_id, title, type, order_num, is_preview, mux_status')
      .single();

    if (error || !lesson) {
      console.error('Insert lesson error:', error);
      return NextResponse.json(
        { error: 'Errore durante la creazione della lezione.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (err) {
    console.error('POST lessons error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
