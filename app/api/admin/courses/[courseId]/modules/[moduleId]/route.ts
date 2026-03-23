import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { courseId: string; moduleId: string };
}

/** PATCH /api/admin/courses/[courseId]/modules/[moduleId] — update module */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.orderNum !== undefined) updateData.order_num = body.orderNum;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nessun campo da aggiornare.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const { data: mod, error } = await admin
      .from('modules')
      .update(updateData)
      .eq('id', params.moduleId)
      .eq('course_id', params.courseId)
      .select('id, course_id, title, order_num')
      .single();

    if (error || !mod) {
      console.error('Update module error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento del modulo.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ module: mod });
  } catch (err) {
    console.error('PATCH module error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/courses/[courseId]/modules/[moduleId] — delete module */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { error } = await admin
      .from('modules')
      .delete()
      .eq('id', params.moduleId)
      .eq('course_id', params.courseId);

    if (error) {
      console.error('Delete module error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'eliminazione del modulo.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE module error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
