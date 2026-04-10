import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { pathId: string; courseId: string };
}

/** PATCH /api/admin/learning-paths/[pathId]/courses/[courseId] — update course entry (e.g. is_exclusive) */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { pathId, courseId } = params;
    const body = (await req.json()) as { isExclusive?: boolean };

    const updates: Record<string, unknown> = {};
    if (body.isExclusive !== undefined) updates.is_exclusive = body.isExclusive;

    const { error } = await admin
      .from('learning_path_courses')
      .update(updates)
      .eq('path_id', pathId)
      .eq('course_id', courseId);

    if (error) {
      console.error('PATCH learning_path_courses error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/admin/learning-paths/[pathId]/courses/[courseId] error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/learning-paths/[pathId]/courses/[courseId] — remove a course from the path */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { pathId, courseId } = params;

    const { error } = await admin
      .from('learning_path_courses')
      .delete()
      .eq('path_id', pathId)
      .eq('course_id', courseId);

    if (error) {
      console.error('Delete learning_path_courses error:', error);
      return NextResponse.json(
        { error: 'Errore durante la rimozione del corso dal percorso.' } satisfies ApiError,
        { status: 500 },
      );
    }

    revalidatePath(`/admin/learning-paths/${pathId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/learning-paths/[pathId]/courses/[courseId] error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
