import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, ReorderPayload } from '@/types';

interface RouteParams {
  params: { courseId: string };
}

/** POST /api/admin/courses/[courseId]/modules — create a module */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { courseId } = params;
    const body = await req.json();

    if (!body.title) {
      return NextResponse.json(
        { error: 'Il titolo del modulo è obbligatorio.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Get next order_num
    const { data: lastModule } = await admin
      .from('modules')
      .select('order_num')
      .eq('course_id', courseId)
      .order('order_num', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = ((lastModule as { order_num: number } | null)?.order_num ?? 0) + 1;

    const { data: mod, error } = await admin
      .from('modules')
      .insert({
        course_id: courseId,
        title: body.title,
        order_num: nextOrder,
      })
      .select('id, course_id, title, order_num')
      .single();

    if (error || !mod) {
      console.error('Insert module error:', error);
      return NextResponse.json(
        { error: 'Errore durante la creazione del modulo.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ module: mod }, { status: 201 });
  } catch (err) {
    console.error('POST modules error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** PATCH /api/admin/courses/[courseId]/modules — reorder modules */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = (await req.json()) as ReorderPayload;

    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: 'Formato non valido. Invia { items: [{ id, orderNum }] }.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Update each module's order_num
    const updates = body.items.map((item) =>
      admin
        .from('modules')
        .update({ order_num: item.orderNum })
        .eq('id', item.id)
        .eq('course_id', params.courseId),
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH reorder modules error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
