import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

/** POST /api/admin/courses/reorder — update order_num for all courses */
export async function POST(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { ids } = (await req.json()) as { ids: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids array required.' } satisfies ApiError,
        { status: 400 },
      );
    }

    await Promise.all(
      ids.map((id, index) =>
        admin.from('courses').update({ order_num: index + 1 }).eq('id', id),
      ),
    );

    revalidatePath('/admin/corsi');
    revalidatePath('/catalogo-corsi');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/admin/courses/reorder error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
