import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { courseId: string; lessonId: string };
}

/** PATCH /api/admin/courses/[courseId]/lessons/[lessonId] — update lesson */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.orderNum !== undefined) updateData.order_num = body.orderNum;
    if (body.isPreview !== undefined) updateData.is_preview = body.isPreview;
    if (body.durationSec !== undefined) updateData.duration_sec = body.durationSec;
    if (body.moduleId !== undefined) updateData.module_id = body.moduleId;
    if (body.muxStatus !== undefined) updateData.mux_status = body.muxStatus;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nessun campo da aggiornare.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const { data: lesson, error } = await admin
      .from('lessons')
      .update(updateData)
      .eq('id', params.lessonId)
      .select('id, module_id, title, type, order_num, is_preview, mux_playback_id, mux_asset_id, mux_status, duration_sec')
      .single();

    if (error || !lesson) {
      console.error('Update lesson error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento della lezione.' } satisfies ApiError,
        { status: 500 },
      );
    }

    revalidatePath(`/admin/corsi/${params.courseId}`);
    return NextResponse.json({ lesson });
  } catch (err) {
    console.error('PATCH lesson error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/courses/[courseId]/lessons/[lessonId] — delete lesson and recompact order */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    // Get the module_id before deleting
    const { data: lesson } = await admin
      .from('lessons')
      .select('module_id')
      .eq('id', params.lessonId)
      .single();

    const moduleId = (lesson as { module_id: string } | null)?.module_id;

    const { error } = await admin
      .from('lessons')
      .delete()
      .eq('id', params.lessonId);

    if (error) {
      console.error('Delete lesson error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'eliminazione della lezione.' } satisfies ApiError,
        { status: 500 },
      );
    }

    // Recompact order_num for remaining lessons in the module
    if (moduleId) {
      const { data: remaining } = await admin
        .from('lessons')
        .select('id')
        .eq('module_id', moduleId)
        .order('order_num', { ascending: true });

      const rows = (remaining ?? []) as { id: string }[];
      if (rows.length > 0) {
        await Promise.all(
          rows.map((row, i) =>
            admin.from('lessons').update({ order_num: i + 1 }).eq('id', row.id),
          ),
        );
      }
    }

    revalidatePath(`/admin/corsi/${params.courseId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE lesson error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
