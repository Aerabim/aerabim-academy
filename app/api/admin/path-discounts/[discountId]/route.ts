import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, CreatePathDiscountPayload } from '@/types';

interface RouteParams { params: { discountId: string } }

/** PATCH /api/admin/path-discounts/[discountId] — update a path discount */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = (await req.json()) as Partial<CreatePathDiscountPayload> & { isActive?: boolean };

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined)        updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description?.trim() ?? null;
    if (body.discountPct !== undefined) updates.discount_pct = body.discountPct;
    if (body.startsAt !== undefined)    updates.starts_at = body.startsAt;
    if (body.endsAt !== undefined)      updates.ends_at = body.endsAt;
    if (body.scope !== undefined)       updates.scope = body.scope;
    if (body.pathId !== undefined)      updates.path_id = body.pathId ?? null;
    if (body.isActive !== undefined)    updates.is_active = body.isActive;

    // If switching to scope=all, clear path_id
    if (body.scope === 'all') updates.path_id = null;

    const { data: discount, error } = await admin
      .from('path_discounts')
      .update(updates)
      .eq('id', params.discountId)
      .select()
      .single();

    if (error || !discount) {
      console.error('PATCH path_discount error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento dello sconto.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ discount });
  } catch (err) {
    console.error('PATCH /api/admin/path-discounts/[discountId] error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/path-discounts/[discountId] — delete a path discount */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { error } = await admin
      .from('path_discounts')
      .delete()
      .eq('id', params.discountId);

    if (error) {
      console.error('DELETE path_discount error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'eliminazione dello sconto.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/path-discounts/[discountId] error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
