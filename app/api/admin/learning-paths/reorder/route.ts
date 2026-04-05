import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

interface ReorderItem {
  id: string;
  orderNum: number;
}

/**
 * PATCH /api/admin/learning-paths/reorder
 *
 * Two-phase update to avoid UNIQUE(order_num) conflicts:
 *   Phase 1 — set all order_nums to large negative temp values
 *   Phase 2 — set the desired final order_nums
 */
export async function PATCH(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = (await req.json()) as { items: ReorderItem[] };

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Formato non valido. Invia { items: [{ id, orderNum }] }.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Phase 1: temporary negative values
    await Promise.all(
      body.items.map((item, index) =>
        admin
          .from('learning_paths')
          .update({ order_num: -(index + 1) * 1000 })
          .eq('id', item.id),
      ),
    );

    // Phase 2: final order_nums
    await Promise.all(
      body.items.map((item) =>
        admin
          .from('learning_paths')
          .update({ order_num: item.orderNum })
          .eq('id', item.id),
      ),
    );

    revalidatePath('/admin/learning-paths');
    revalidatePath('/learning-paths');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/admin/learning-paths/reorder error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
