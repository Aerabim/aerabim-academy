import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getStripeServer } from '@/lib/stripe/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { CheckoutLearningPathRequest } from '@/types';

export async function POST(request: Request) {
  try {
    // 1. Autentica utente
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato.' }, { status: 401 });
    }

    // 2. Parsing body
    const body = (await request.json()) as CheckoutLearningPathRequest;
    const { pathId, pathSlug } = body;

    if (!pathId || !pathSlug) {
      return NextResponse.json({ error: 'Parametri mancanti.' }, { status: 400 });
    }

    // 3. Fetch percorso da DB
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Servizio temporaneamente non disponibile.' },
        { status: 503 },
      );
    }

    const { data: pathData } = await admin
      .from('learning_paths')
      .select('id, slug, title, price_single, stripe_price_id, is_published')
      .eq('id', pathId)
      .eq('is_published', true)
      .maybeSingle() as {
        data: {
          id: string; slug: string; title: string;
          price_single: number; stripe_price_id: string | null; is_published: boolean;
        } | null;
      };

    if (!pathData) {
      return NextResponse.json({ error: 'Percorso non trovato.' }, { status: 404 });
    }

    // 4. Controlla se già enrollato (idempotente)
    const { data: existingEnroll } = await admin
      .from('learning_path_enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('path_id', pathId)
      .maybeSingle();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (existingEnroll) {
      return NextResponse.json({ url: `${appUrl}/learning-paths/${pathSlug}` });
    }

    // 5. Se gratuito → enrollment diretto
    if (!pathData.price_single || pathData.price_single <= 0) {
      const { error: enrollError } = await admin
        .from('learning_path_enrollments')
        .insert({ user_id: user.id, path_id: pathId, stripe_payment_intent_id: null });

      if (enrollError) {
        console.error('Free path enrollment error:', enrollError);
        return NextResponse.json(
          { error: 'Errore durante l\'iscrizione. Riprova.' },
          { status: 500 },
        );
      }

      return NextResponse.json({ url: `${appUrl}/learning-paths/${pathSlug}?success=true` });
    }

    // 6. Verifica Stripe disponibile
    const stripe = getStripeServer();
    if (!stripe) {
      return NextResponse.json(
        { error: 'I pagamenti non sono ancora disponibili. Riprova più tardi.' },
        { status: 503 },
      );
    }

    if (!pathData.stripe_price_id) {
      return NextResponse.json(
        { error: 'Questo percorso non è ancora acquistabile. Contatta il supporto.' },
        { status: 400 },
      );
    }

    // 7. Crea Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [{ price: pathData.stripe_price_id, quantity: 1 }],
      metadata: {
        userId: user.id,
        pathId,
        pathSlug,
        type: 'learning_path',
      },
      success_url: `${appUrl}/learning-paths/${pathSlug}?success=true`,
      cancel_url: `${appUrl}/learning-paths/${pathSlug}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout learning-path error:', err);
    return NextResponse.json(
      { error: 'Si è verificato un errore. Riprova più tardi.' },
      { status: 500 },
    );
  }
}
