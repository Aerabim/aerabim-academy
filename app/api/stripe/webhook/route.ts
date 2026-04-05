import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripeServer } from '@/lib/stripe/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/resend/client';
import { purchaseConfirmationEmail, subscriptionCanceledEmail } from '@/lib/resend/templates';
import { createNotification } from '@/lib/notifications/create';
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
    if (!metadata.courseId) {
      console.error('Webhook: courseId mancante nella metadata per acquisto single');
      throw new Error('Missing courseId in metadata for single purchase');
    }

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

    // Send purchase confirmation email
    try {
      const customerEmail = session.customer_email ?? session.customer_details?.email;
      if (customerEmail && metadata.courseId) {
        const { data: course } = await admin
          .from('courses')
          .select('title, slug, price_single')
          .eq('id', metadata.courseId)
          .single();
        const courseData = course as { title: string; slug: string; price_single: number } | null;
        if (courseData) {
          const amount = `€${(courseData.price_single / 100).toFixed(2)}`;
          const { data: userData } = await admin.auth.admin.getUserById(metadata.userId);
          const userName = (userData?.user?.user_metadata?.full_name as string) || 'studente';
          const email = purchaseConfirmationEmail({
            userName,
            courseName: courseData.title,
            amount,
            courseSlug: courseData.slug,
          });
          sendEmail({ to: customerEmail, ...email });
        }
      }
    } catch (emailErr) {
      console.error('Webhook: errore invio email conferma acquisto:', emailErr);
    }

    // Create notification for single purchase
    try {
      const { data: courseInfo } = await admin
        .from('courses')
        .select('title, slug')
        .eq('id', metadata.courseId)
        .single();
      const course = courseInfo as { title: string; slug: string } | null;
      createNotification(admin, {
        userId: metadata.userId,
        type: 'purchase_confirmed',
        title: `Acquisto confermato: ${course?.title ?? 'corso'}`,
        body: 'Puoi iniziare subito a studiare.',
        href: course ? `/learn/${metadata.courseId}` : '/i-miei-corsi',
      });
    } catch {
      // Notification failure must never block webhook
    }
  }

  if (metadata.type === 'learning_path') {
    if (!metadata.pathId) {
      console.error('Webhook: pathId mancante nella metadata per acquisto learning_path');
      throw new Error('Missing pathId in metadata for learning_path purchase');
    }

    const paymentIntent = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : null;

    const { error: enrollError } = await admin
      .from('learning_path_enrollments')
      .upsert(
        {
          user_id: metadata.userId,
          path_id: metadata.pathId,
          stripe_payment_intent_id: paymentIntent,
        },
        { onConflict: 'user_id,path_id' },
      );

    if (enrollError) {
      console.error('Webhook: errore creazione learning_path_enrollment:', enrollError);
      throw enrollError;
    }

    // Notifica non-blocking
    try {
      const { data: pathInfo } = await admin
        .from('learning_paths')
        .select('title')
        .eq('id', metadata.pathId)
        .single();
      const pathTitle = (pathInfo as { title: string } | null)?.title ?? 'percorso';
      createNotification(admin, {
        userId: metadata.userId,
        type: 'purchase_confirmed',
        title: `Percorso acquistato: ${pathTitle}`,
        body: 'Ora puoi accedere alle simulazioni d\'esame del percorso.',
        href: `/learning-paths/${metadata.pathSlug ?? ''}`,
      });
    } catch {
      // Notification failure must never block webhook
    }

    return;
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

    // Fetch subscription details for period_end (on items in Stripe SDK v20+)
    let periodEnd: string | null = null;
    const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items'] });
    const firstItem = sub.items?.data?.[0];
    if (firstItem?.current_period_end) {
      periodEnd = new Date(firstItem.current_period_end * 1000).toISOString();
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
      .eq('status', 'published');

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

    // Create notification for Pro subscription
    createNotification(admin, {
      userId: metadata.userId,
      type: 'subscription_activated',
      title: 'Abbonamento Pro attivato',
      body: 'Hai accesso a tutti i corsi della piattaforma.',
      href: '/i-miei-corsi',
    });
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  admin: SupabaseClient,
) {
  const firstItem = subscription.items?.data?.[0];
  const periodEndTs = firstItem?.current_period_end;
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

  // Send cancellation email
  try {
    const { data: userData } = await admin.auth.admin.getUserById(userId);
    const userEmail = userData?.user?.email;
    if (userEmail) {
      const userName = (userData?.user?.user_metadata?.full_name as string) || 'studente';
      const endDate = new Date(periodEnd).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const email = subscriptionCanceledEmail({ userName, endDate });
      sendEmail({ to: userEmail, ...email });
    }
  } catch (emailErr) {
    console.error('Webhook: errore invio email cancellazione:', emailErr);
  }

  // Create notification
  const endDateShort = new Date(periodEnd).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
  });
  createNotification(admin, {
    userId,
    type: 'subscription_canceled',
    title: 'Abbonamento cancellato',
    body: `Il tuo accesso Pro resta attivo fino al ${endDateShort}.`,
    href: '/profilo',
  });
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  admin: SupabaseClient,
) {
  const firstItem = subscription.items?.data?.[0];
  const periodEndTs = firstItem?.current_period_end;
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
