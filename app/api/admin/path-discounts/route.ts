import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, CreatePathDiscountPayload } from '@/types';

/** GET /api/admin/path-discounts — list all path discounts */
export async function GET() {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { data, error } = await admin
      .from('path_discounts')
      .select('*, learning_paths(id, title)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET path_discounts error:', error);
      return NextResponse.json(
        { error: 'Errore nel caricamento degli sconti.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ discounts: data ?? [] });
  } catch (err) {
    console.error('GET /api/admin/path-discounts error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** POST /api/admin/path-discounts — create a new path discount */
export async function POST(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = (await req.json()) as CreatePathDiscountPayload;

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Il nome della promozione è obbligatorio.' } satisfies ApiError,
        { status: 400 },
      );
    }
    if (!body.discountPct || body.discountPct < 1 || body.discountPct > 100) {
      return NextResponse.json(
        { error: 'Lo sconto deve essere tra 1 e 100.' } satisfies ApiError,
        { status: 400 },
      );
    }
    if (!body.startsAt || !body.endsAt) {
      return NextResponse.json(
        { error: 'Le date di inizio e fine sono obbligatorie.' } satisfies ApiError,
        { status: 400 },
      );
    }
    if (new Date(body.startsAt) >= new Date(body.endsAt)) {
      return NextResponse.json(
        { error: 'La data di fine deve essere successiva alla data di inizio.' } satisfies ApiError,
        { status: 400 },
      );
    }
    if (body.scope === 'path' && !body.pathId) {
      return NextResponse.json(
        { error: 'Seleziona un percorso per la promozione mirata.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const { data: discount, error } = await admin
      .from('path_discounts')
      .insert({
        name: body.name.trim(),
        description: body.description?.trim() ?? null,
        discount_pct: body.discountPct,
        starts_at: body.startsAt,
        ends_at: body.endsAt,
        scope: body.scope,
        path_id: body.scope === 'path' ? (body.pathId ?? null) : null,
        is_active: body.isActive ?? true,
      })
      .select()
      .single();

    if (error || !discount) {
      console.error('Insert path_discount error:', error);
      return NextResponse.json(
        { error: 'Errore durante la creazione dello sconto.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ discount }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/path-discounts error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
