import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { Promotion, UpdatePromotionPayload, ApiError } from '@/types';

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;
  const { admin } = auth;

  try {
    const body = (await request.json()) as UpdatePromotionPayload;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined)             updates.name             = body.name.trim();
    if (body.type !== undefined)             updates.type             = body.type;
    if (body.is_active !== undefined)        updates.is_active        = body.is_active;
    if (body.title !== undefined)            updates.title            = body.title.trim();
    if (body.body !== undefined)             updates.body             = body.body?.trim() ?? null;
    if (body.cta_label !== undefined)        updates.cta_label        = body.cta_label?.trim() ?? null;
    if (body.cta_url !== undefined)          updates.cta_url          = body.cta_url?.trim() ?? null;
    if (body.badge_label !== undefined)      updates.badge_label      = body.badge_label?.trim() ?? null;
    if (body.theme !== undefined)            updates.theme            = body.theme;
    if (body.starts_at !== undefined)        updates.starts_at        = body.starts_at ?? null;
    if (body.ends_at !== undefined)          updates.ends_at          = body.ends_at ?? null;
    if (body.popup_delay_sec !== undefined)  updates.popup_delay_sec  = body.popup_delay_sec;
    if (body.popup_frequency !== undefined)  updates.popup_frequency  = body.popup_frequency;
    if (body.target_audience !== undefined)  updates.target_audience  = body.target_audience;

    const { data, error } = await admin
      .from('promotions')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ promotion: data as Promotion });
  } catch (err) {
    console.error('PATCH /api/admin/promotions/[id] error:', err);
    return NextResponse.json(
      { error: 'Errore nel salvataggio della promozione.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;
  const { admin } = auth;

  try {
    const { error } = await admin
      .from('promotions')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/promotions/[id] error:', err);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione della promozione.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
