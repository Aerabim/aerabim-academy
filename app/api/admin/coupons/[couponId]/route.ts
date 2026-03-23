import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import { getStripeServer } from '@/lib/stripe/client';
import type { ApiError } from '@/types';

export async function PATCH(
  request: Request,
  { params }: { params: { couponId: string } },
) {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;

  const stripe = getStripeServer();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe non configurato.' } satisfies ApiError, { status: 500 });
  }

  try {
    const body = (await request.json()) as { active: boolean };
    await stripe.promotionCodes.update(params.couponId, { active: body.active });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update coupon error:', err);
    return NextResponse.json({ error: 'Errore nell\'aggiornamento del coupon.' } satisfies ApiError, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { couponId: string } },
) {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;

  const stripe = getStripeServer();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe non configurato.' } satisfies ApiError, { status: 500 });
  }

  try {
    const body = (await request.json()) as { stripeCouponId: string };
    await stripe.coupons.del(body.stripeCouponId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete coupon error:', err);
    return NextResponse.json({ error: 'Errore nell\'eliminazione del coupon.' } satisfies ApiError, { status: 500 });
  }
}
