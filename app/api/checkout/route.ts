import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getStripeServer } from '@/lib/stripe/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { PLACEHOLDER_COURSES } from '@/lib/placeholder-data';
import type { CheckoutRequest } from '@/types';

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // 2. Parse request body
    const body = (await request.json()) as CheckoutRequest;
    const { courseId, courseSlug, type } = body;

    if (!courseId || !courseSlug || !type) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
    }

    // 3. Find course data
    const course = PLACEHOLDER_COURSES.find((c) => c.id === courseId);
    if (!course) {
      return NextResponse.json({ error: 'Corso non trovato' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // 4. Handle free enrollment (no Stripe needed)
    if (type === 'free') {
      if (!course.isFree) {
        return NextResponse.json({ error: 'Questo corso non è gratuito' }, { status: 400 });
      }

      const admin = getSupabaseAdmin();
      if (!admin) {
        return NextResponse.json(
          { error: 'Servizio temporaneamente non disponibile' },
          { status: 503 },
        );
      }

      const { error: enrollError } = await admin
        .from('enrollments')
        .upsert(
          {
            user_id: user.id,
            course_id: courseId,
            access_type: 'free',
            stripe_payment_intent_id: null,
            expires_at: null,
          },
          { onConflict: 'user_id,course_id' },
        );

      if (enrollError) {
        console.error('Enrollment error:', enrollError);
        return NextResponse.json(
          { error: 'Errore durante l\'iscrizione. Riprova.' },
          { status: 500 },
        );
      }

      return NextResponse.json({ url: `${appUrl}/catalogo-corsi/${courseSlug}?success=true` });
    }

    // 5. Check Stripe availability
    const stripe = getStripeServer();
    if (!stripe) {
      return NextResponse.json(
        { error: 'I pagamenti non sono ancora disponibili. Riprova più tardi.' },
        { status: 503 },
      );
    }

    // 6. Create Stripe Checkout Session
    if (type === 'single') {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: 'eur',
              unit_amount: course.priceSingle,
              product_data: {
                name: course.title,
                description: course.description,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: user.id,
          courseId,
          courseSlug,
          type: 'single',
        },
        success_url: `${appUrl}/catalogo-corsi/${courseSlug}?success=true`,
        cancel_url: `${appUrl}/catalogo-corsi/${courseSlug}?canceled=true`,
      });

      return NextResponse.json({ url: session.url });
    }

    if (type === 'pro_subscription') {
      const proPriceId = process.env.STRIPE_PRICE_PRO_ANNUAL;
      if (!proPriceId) {
        return NextResponse.json(
          { error: 'Piano Pro non ancora configurato.' },
          { status: 503 },
        );
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: user.email,
        line_items: [{ price: proPriceId, quantity: 1 }],
        metadata: {
          userId: user.id,
          courseSlug,
          type: 'pro_subscription',
        },
        success_url: `${appUrl}/catalogo-corsi/${courseSlug}?success=true`,
        cancel_url: `${appUrl}/catalogo-corsi/${courseSlug}?canceled=true`,
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: 'Tipo di checkout non valido' }, { status: 400 });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json(
      { error: 'Si è verificato un errore. Riprova più tardi.' },
      { status: 500 },
    );
  }
}
