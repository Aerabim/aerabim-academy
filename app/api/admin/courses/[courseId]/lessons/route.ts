import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, CreateLessonPayload } from '@/types';

interface RouteParams {
  params: { courseId: string };
}

interface ReorderItem {
  id: string;
  orderNum: number;
}

/** PATCH /api/admin/courses/[courseId]/lessons — reorder lessons */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = (await req.json()) as { items: ReorderItem[] };

    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: 'Formato non valido. Invia { items: [{ id, orderNum }] }.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Verify all lessons belong to a module of this course
    const lessonIds = body.items.map((i) => i.id);
    const { data: lessonRows } = await admin
      .from('lessons')
      .select('id, modules!inner(course_id)')
      .in('id', lessonIds.length > 0 ? lessonIds : ['']);

    const validIds = new Set(
      ((lessonRows ?? []) as unknown as { id: string; modules: { course_id: string } }[])
        .filter((l) => l.modules.course_id === params.courseId)
        .map((l) => l.id),
    );

    const updates = body.items
      .filter((item) => validIds.has(item.id))
      .map((item) =>
        admin
          .from('lessons')
          .update({ order_num: item.orderNum })
          .eq('id', item.id),
      );

    await Promise.all(updates);

    revalidatePath(`/admin/corsi/${params.courseId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH reorder lessons error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
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

    revalidatePath(`/admin/corsi/${params.courseId}`);
    return NextResponse.json({ lesson }, { status: 201 });
  } catch (err) {
    console.error('POST lessons error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
