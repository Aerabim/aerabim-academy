import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { Promotion, CreatePromotionPayload, ApiError } from '@/types';

export async function GET() {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;
  const { admin } = auth;

  try {
    const { data, error } = await admin
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ promotions: (data ?? []) as Promotion[] });
  } catch (err) {
    console.error('GET /api/admin/promotions error:', err);
    return NextResponse.json(
      { error: 'Errore nel recupero delle promozioni.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;
  const { admin } = auth;

  try {
    const body = (await request.json()) as CreatePromotionPayload;

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Il nome interno è obbligatorio.' } satisfies ApiError, { status: 400 });
    }
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Il titolo è obbligatorio.' } satisfies ApiError, { status: 400 });
    }
    if (!body.type || !['banner', 'popup'].includes(body.type)) {
      return NextResponse.json({ error: 'Tipo non valido.' } satisfies ApiError, { status: 400 });
    }

    const { data, error } = await admin
      .from('promotions')
      .insert({
        name: body.name.trim(),
        type: body.type,
        title: body.title.trim(),
        body: body.body?.trim() ?? null,
        cta_label: body.cta_label?.trim() ?? null,
        cta_url: body.cta_url?.trim() ?? null,
        badge_label: body.badge_label?.trim() ?? null,
        theme: body.theme ?? 'amber',
        starts_at: body.starts_at ?? null,
        ends_at: body.ends_at ?? null,
        popup_delay_sec: body.popup_delay_sec ?? 3,
        popup_frequency: body.popup_frequency ?? 'once',
        target_audience: body.target_audience ?? 'all',
        is_active: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ promotion: data as Promotion }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/promotions error:', err);
    return NextResponse.json(
      { error: 'Errore nella creazione della promozione.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
