import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, ReorderLearningPathStepsPayload } from '@/types';

interface RouteParams {
  params: { pathId: string };
}

/**
 * PATCH /api/admin/learning-paths/[pathId]/steps/reorder
 *
 * Reorders all steps of a path.
 * Uses a two-phase update to avoid temporary conflicts on the
 * UNIQUE(path_id, order_num) constraint:
 *   Phase 1 — set all order_nums to large negative temp values
 *   Phase 2 — set the desired final order_nums
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { pathId } = params;
    const body = (await req.json()) as ReorderLearningPathStepsPayload;

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Formato non valido. Invia { items: [{ id, orderNum }] }.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Validate all items belong to this path (security: prevent cross-path manipulation)
    const stepIds = body.items.map((i) => i.id);
    const { data: owned } = await admin
      .from('learning_path_steps')
      .select('id')
      .eq('path_id', pathId)
      .in('id', stepIds);

    const ownedIds = new Set(((owned ?? []) as { id: string }[]).map((r) => r.id));
    const allOwned = body.items.every((i) => ownedIds.has(i.id));
    if (!allOwned) {
      return NextResponse.json(
        { error: 'Uno o più passi non appartengono a questo percorso.' } satisfies ApiError,
        { status: 403 },
      );
    }

    // Phase 1: set temporary negative values to avoid unique constraint conflicts
    await Promise.all(
      body.items.map((item, index) =>
        admin
          .from('learning_path_steps')
          .update({ order_num: -(index + 1) * 1000 })
          .eq('id', item.id)
          .eq('path_id', pathId),
      ),
    );

    // Phase 2: set the desired final order_nums
    await Promise.all(
      body.items.map((item) =>
        admin
          .from('learning_path_steps')
          .update({ order_num: item.orderNum })
          .eq('id', item.id)
          .eq('path_id', pathId),
      ),
    );

    revalidatePath(`/admin/learning-paths/${pathId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/admin/learning-paths/[pathId]/steps/reorder error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
