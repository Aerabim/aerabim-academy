import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getStripeServer } from '@/lib/stripe/client';

interface CancelRequest {
  stripeSubscriptionId: string;
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // 2. Parse request
    const body = (await request.json()) as CancelRequest;
    const { stripeSubscriptionId } = body;

    if (!stripeSubscriptionId) {
      return NextResponse.json({ error: 'ID abbonamento mancante' }, { status: 400 });
    }

    // 3. Verify the subscription belongs to this user
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id, status')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Abbonamento non trovato' }, { status: 404 });
    }

    const sub = subscription as { user_id: string; status: string };
    if (sub.status !== 'active') {
      return NextResponse.json({ error: 'Abbonamento non attivo' }, { status: 400 });
    }

    // 4. Cancel on Stripe (at period end — user keeps access until expiry)
    const stripe = getStripeServer();
    if (!stripe) {
      return NextResponse.json({ error: 'Servizio pagamenti non disponibile' }, { status: 503 });
    }

    try {
      await stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    } catch (stripeErr) {
      console.error('Stripe subscription update error:', stripeErr);
      return NextResponse.json(
        { error: 'Errore nella cancellazione dell\'abbonamento su Stripe. Riprova.' },
        { status: 502 },
      );
    }

    // Note: the actual DB update happens when Stripe fires the
    // customer.subscription.deleted webhook at period end.

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Subscription cancel error:', err);
    return NextResponse.json(
      { error: 'Si è verificato un errore. Riprova più tardi.' },
      { status: 500 },
    );
  }
}
