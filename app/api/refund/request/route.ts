import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getStripeServer } from '@/lib/stripe/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createNotification } from '@/lib/notifications/create';

interface RefundRequest {
  enrollmentId: string;
}

const REFUND_WINDOW_DAYS = 14;

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
    const body = (await request.json()) as RefundRequest;
    const { enrollmentId } = body;

    if (!enrollmentId) {
      return NextResponse.json({ error: 'ID enrollment mancante' }, { status: 400 });
    }

    // 3. Fetch enrollment and verify ownership
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('id, user_id, course_id, access_type, stripe_payment_intent_id, created_at')
      .eq('id', enrollmentId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (enrollError || !enrollment) {
      return NextResponse.json({ error: 'Acquisto non trovato' }, { status: 404 });
    }

    const enroll = enrollment as {
      id: string;
      user_id: string;
      course_id: string;
      access_type: string;
      stripe_payment_intent_id: string | null;
      created_at: string;
    };

    // 4. Only single purchases are refundable (not subscriptions or free)
    if (enroll.access_type !== 'single') {
      return NextResponse.json(
        { error: 'Solo gli acquisti singoli sono rimborsabili. Per gli abbonamenti, usa la cancellazione.' },
        { status: 400 },
      );
    }

    if (!enroll.stripe_payment_intent_id) {
      return NextResponse.json({ error: 'Pagamento non trovato per questo acquisto' }, { status: 400 });
    }

    // 5. Check 14-day refund window (EU right of withdrawal)
    const purchaseDate = new Date(enroll.created_at);
    const now = new Date();
    const daysSincePurchase = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSincePurchase > REFUND_WINDOW_DAYS) {
      return NextResponse.json(
        { error: `Il periodo di rimborso di ${REFUND_WINDOW_DAYS} giorni è scaduto. L'acquisto è stato effettuato ${daysSincePurchase} giorni fa.` },
        { status: 400 },
      );
    }

    // 6. Create refund on Stripe (check for existing refund first)
    const stripe = getStripeServer();
    if (!stripe) {
      return NextResponse.json({ error: 'Servizio pagamenti non disponibile' }, { status: 503 });
    }

    // Check if a refund already exists for this payment
    const existingRefunds = await stripe.refunds.list({
      payment_intent: enroll.stripe_payment_intent_id,
      limit: 1,
    });

    if (existingRefunds.data.length > 0) {
      return NextResponse.json(
        { error: 'Rimborso già elaborato per questo acquisto.' },
        { status: 400 },
      );
    }

    await stripe.refunds.create({
      payment_intent: enroll.stripe_payment_intent_id,
    });

    // 7. Remove enrollment via admin client (bypasses RLS)
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Servizio temporaneamente non disponibile' }, { status: 503 });
    }

    const { error: deleteError } = await admin
      .from('enrollments')
      .delete()
      .eq('id', enroll.id);

    if (deleteError) {
      console.error('Refund: errore rimozione enrollment:', deleteError);
      // Refund on Stripe succeeded, but enrollment deletion failed.
      // Log the error but still return success — the refund is what matters.
    }

    // Create refund notification
    createNotification(admin, {
      userId: user.id,
      type: 'refund_processed',
      title: 'Rimborso elaborato',
      body: 'Il rimborso è stato processato. L\'importo sarà riaccreditato entro 5-10 giorni lavorativi.',
      href: '/profilo',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Refund error:', err);
    return NextResponse.json(
      { error: 'Si è verificato un errore. Riprova più tardi.' },
      { status: 500 },
    );
  }
}
