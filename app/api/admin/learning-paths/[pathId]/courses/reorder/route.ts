import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, ReorderLearningPathCoursesPayload } from '@/types';

interface RouteParams {
  params: { pathId: string };
}

/**
 * PATCH /api/admin/learning-paths/[pathId]/courses/reorder
 *
 * Reorders courses within a path.
 * The PK is (path_id, course_id) so each row is uniquely identified
 * without unique constraint conflicts on order_num.
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { pathId } = params;
    const body = (await req.json()) as ReorderLearningPathCoursesPayload;

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Formato non valido. Invia { items: [{ courseId, orderNum }] }.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Validate all courseIds belong to this path
    const courseIds = body.items.map((i) => i.courseId);
    const { data: owned } = await admin
      .from('learning_path_courses')
      .select('course_id')
      .eq('path_id', pathId)
      .in('course_id', courseIds);

    const ownedIds = new Set(((owned ?? []) as { course_id: string }[]).map((r) => r.course_id));
    const allOwned = body.items.every((i) => ownedIds.has(i.courseId));

    if (!allOwned) {
      return NextResponse.json(
        { error: 'Uno o più corsi non appartengono a questo percorso.' } satisfies ApiError,
        { status: 403 },
      );
    }

    // Update order_num for each course in the path
    await Promise.all(
      body.items.map((item) =>
        admin
          .from('learning_path_courses')
          .update({ order_num: item.orderNum })
          .eq('path_id', pathId)
          .eq('course_id', item.courseId),
      ),
    );

    revalidatePath(`/admin/learning-paths/${pathId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/admin/learning-paths/[pathId]/courses/reorder error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
