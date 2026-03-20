import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripeServer } from '@/lib/stripe/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const stripe = getStripeServer();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe non configurato' }, { status: 503 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Database admin non configurato' }, { status: 503 });
  }

  // 1. Verify webhook signature
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Firma webhook mancante' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Firma non valida';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: `Firma non valida: ${message}` }, { status: 400 });
  }

  // 2. Handle events
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, admin, stripe);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, admin);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, admin);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json({ error: 'Errore interno webhook' }, { status: 500 });
  }
}

// ── Event Handlers ──────────────────────────────────

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  admin: SupabaseClient,
  stripe: Stripe,
) {
  const metadata = session.metadata;
  if (!metadata?.userId || !metadata?.type) {
    console.error('Webhook: metadata mancante nella session');
    return;
  }

  if (metadata.type === 'single') {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 24);

    const paymentIntent = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : null;

    const { error } = await admin
      .from('enrollments')
      .upsert(
        {
          user_id: metadata.userId,
          course_id: metadata.courseId,
          access_type: 'single',
          stripe_payment_intent_id: paymentIntent,
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: 'user_id,course_id' },
      );

    if (error) {
      console.error('Webhook: errore creazione enrollment single:', error);
      throw error;
    }
  }

  if (metadata.type === 'pro_subscription') {
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : null;
    const customerId = typeof session.customer === 'string'
      ? session.customer
      : null;

    if (!subscriptionId || !customerId) {
      console.error('Webhook: subscription/customer ID mancante');
      return;
    }

    // Fetch subscription details for period_end
    let periodEnd: string | null = null;
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const periodEndTs = (sub as unknown as Record<string, unknown>).current_period_end as number | undefined;
    if (periodEndTs) {
      periodEnd = new Date(periodEndTs * 1000).toISOString();
    }

    // Create subscription record
    const { error: subError } = await admin
      .from('subscriptions')
      .upsert(
        {
          user_id: metadata.userId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          status: 'active',
          plan: 'pro',
          current_period_end: periodEnd,
        },
        { onConflict: 'stripe_subscription_id' },
      );

    if (subError) {
      console.error('Webhook: errore creazione subscription:', subError);
      throw subError;
    }

    // Enroll in all published courses
    const { data: courses, error: coursesError } = await admin
      .from('courses')
      .select('id')
      .eq('is_published', true);

    if (coursesError) {
      console.error('Webhook: errore fetch corsi:', coursesError);
      throw coursesError;
    }

    if (courses && courses.length > 0) {
      const enrollments = (courses as { id: string }[]).map((c) => ({
        user_id: metadata.userId,
        course_id: c.id,
        access_type: 'pro_subscription',
        stripe_payment_intent_id: null,
        expires_at: null,
      }));

      const { error: enrollError } = await admin
        .from('enrollments')
        .upsert(enrollments, { onConflict: 'user_id,course_id' });

      if (enrollError) {
        console.error('Webhook: errore creazione enrollments Pro:', enrollError);
        throw enrollError;
      }
    }
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  admin: SupabaseClient,
) {
  const periodEndTs = (subscription as unknown as Record<string, unknown>).current_period_end as number | undefined;
  const periodEnd = periodEndTs
    ? new Date(periodEndTs * 1000).toISOString()
    : new Date().toISOString();

  // Update subscription status
  const { data: subRecord, error: subError } = await admin
    .from('subscriptions')
    .update({ status: 'canceled', current_period_end: periodEnd })
    .eq('stripe_subscription_id', subscription.id)
    .select('user_id')
    .single();

  if (subError || !subRecord) {
    console.error('Webhook: errore aggiornamento subscription:', subError);
    return;
  }

  // Set expiry on all pro_subscription enrollments for this user
  const userId = (subRecord as { user_id: string }).user_id;
  const { error: enrollError } = await admin
    .from('enrollments')
    .update({ expires_at: periodEnd })
    .eq('user_id', userId)
    .eq('access_type', 'pro_subscription');

  if (enrollError) {
    console.error('Webhook: errore aggiornamento enrollments expiry:', enrollError);
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  admin: SupabaseClient,
) {
  const periodEndTs = (subscription as unknown as Record<string, unknown>).current_period_end as number | undefined;
  const periodEnd = periodEndTs
    ? new Date(periodEndTs * 1000).toISOString()
    : null;

  const { error } = await admin
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_end: periodEnd,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Webhook: errore aggiornamento subscription:', error);
  }
}
