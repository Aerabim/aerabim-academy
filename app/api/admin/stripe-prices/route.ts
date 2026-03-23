import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import { getStripeServer } from '@/lib/stripe/client';
import type { ApiError } from '@/types';

export async function GET() {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;

  const stripe = getStripeServer();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe non configurato.' } satisfies ApiError, { status: 500 });
  }

  try {
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ['data.product'],
    });

    const items = prices.data.map((p) => {
      const product = p.product;
      const productName = typeof product === 'object' && product !== null && 'name' in product
        ? (product as { name: string }).name
        : '';
      const amount = p.unit_amount ?? 0;
      const currency = (p.currency ?? 'eur').toUpperCase();
      const recurring = p.recurring
        ? `/${p.recurring.interval === 'month' ? 'mese' : p.recurring.interval === 'year' ? 'anno' : p.recurring.interval}`
        : '';

      return {
        id: p.id,
        productName,
        amount,
        currency,
        recurring,
        label: `${productName} — ${(amount / 100).toFixed(2).replace('.', ',')} ${currency}${recurring}`,
      };
    });

    return NextResponse.json({ prices: items });
  } catch (err) {
    console.error('List stripe prices error:', err);
    return NextResponse.json({ error: 'Errore nel recupero dei prezzi.' } satisfies ApiError, { status: 500 });
  }
}
