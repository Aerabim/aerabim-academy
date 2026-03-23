import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyAdmin } from '@/lib/admin/auth';
import { getStripeServer } from '@/lib/stripe/client';
import type { AdminCouponListItem, CreateCouponPayload, ApiError } from '@/types';

export async function GET() {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;

  const stripe = getStripeServer();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe non configurato.' } satisfies ApiError, { status: 500 });
  }

  try {
    const promotionCodes = await stripe.promotionCodes.list({
      limit: 100,
      expand: ['data.coupon'],
    });

    const items: AdminCouponListItem[] = promotionCodes.data.map((pc) => {
      const coupon = pc.promotion?.coupon;
      const isExpanded = coupon !== null && typeof coupon === 'object';
      return {
        id: pc.id,
        code: pc.code,
        couponId: isExpanded ? coupon.id : (typeof coupon === 'string' ? coupon : ''),
        percentOff: isExpanded ? coupon.percent_off : null,
        amountOff: isExpanded ? coupon.amount_off : null,
        currency: isExpanded ? coupon.currency : null,
        duration: isExpanded ? coupon.duration as AdminCouponListItem['duration'] : 'once',
        durationInMonths: isExpanded ? coupon.duration_in_months : null,
        maxRedemptions: pc.max_redemptions,
        timesRedeemed: pc.times_redeemed,
        expiresAt: pc.expires_at ? new Date(pc.expires_at * 1000).toISOString() : null,
        active: pc.active,
      };
    });

    return NextResponse.json({ coupons: items });
  } catch (err) {
    console.error('List coupons error:', err);
    return NextResponse.json({ error: 'Errore nel recupero dei coupon.' } satisfies ApiError, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;

  const stripe = getStripeServer();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe non configurato.' } satisfies ApiError, { status: 500 });
  }

  try {
    const body = (await request.json()) as CreateCouponPayload;

    if (!body.code?.trim()) {
      return NextResponse.json({ error: 'Il codice coupon è obbligatorio.' } satisfies ApiError, { status: 400 });
    }

    // Create the underlying Stripe coupon
    const couponParams: Record<string, unknown> = {
      duration: body.duration,
    };

    if (body.discountType === 'percent') {
      if (!body.percentOff || body.percentOff <= 0 || body.percentOff > 100) {
        return NextResponse.json({ error: 'Percentuale di sconto non valida (1-100).' } satisfies ApiError, { status: 400 });
      }
      couponParams.percent_off = body.percentOff;
    } else {
      if (!body.amountOff || body.amountOff <= 0) {
        return NextResponse.json({ error: 'Importo sconto non valido.' } satisfies ApiError, { status: 400 });
      }
      couponParams.amount_off = body.amountOff;
      couponParams.currency = 'eur';
    }

    if (body.duration === 'repeating' && body.durationInMonths) {
      couponParams.duration_in_months = body.durationInMonths;
    }

    const coupon = await stripe.coupons.create(couponParams as Stripe.CouponCreateParams);

    // Create the promotion code (user-facing code)
    const promoParams: Stripe.PromotionCodeCreateParams = {
      promotion: { type: 'coupon', coupon: coupon.id },
      code: body.code.trim().toUpperCase(),
    };

    if (body.maxRedemptions) {
      promoParams.max_redemptions = body.maxRedemptions;
    }

    if (body.expiresAt) {
      promoParams.expires_at = Math.floor(new Date(body.expiresAt).getTime() / 1000);
    }

    const promoCode = await stripe.promotionCodes.create(promoParams);

    return NextResponse.json({ success: true, promotionCodeId: promoCode.id });
  } catch (err) {
    console.error('Create coupon error:', err);
    const message = err instanceof Error ? err.message : 'Errore nella creazione del coupon.';
    return NextResponse.json({ error: message } satisfies ApiError, { status: 500 });
  }
}
