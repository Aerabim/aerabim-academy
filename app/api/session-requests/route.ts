import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasActiveProSubscription } from '@/lib/live/queries';
import { sendEmail } from '@/lib/resend/client';
import { sessionRequestNotificationEmail } from '@/lib/resend/templates';
import type { ApiError, CreateSessionRequestPayload, SessionRequestSlot } from '@/types';

const VALID_SLOTS: SessionRequestSlot[] = ['mattina', 'pomeriggio', 'sera'];

// ── GET: List user's own session requests ────────────

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Devi effettuare il login.' } satisfies ApiError,
        { status: 401 },
      );
    }

    const { data: requests, error } = await supabase
      .from('session_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch session requests error:', error);
      return NextResponse.json(
        { error: 'Errore nel recupero delle richieste.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ requests: requests ?? [] });
  } catch (err) {
    console.error('Session requests GET error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

// ── POST: Create a new session request ────────────────

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Devi effettuare il login.' } satisfies ApiError,
        { status: 401 },
      );
    }

    const isPro = await hasActiveProSubscription(supabase, user.id);
    if (!isPro) {
      return NextResponse.json(
        { error: 'Le richieste di sessione sono riservate agli abbonati Pro.' } satisfies ApiError,
        { status: 403 },
      );
    }

    const body = (await req.json()) as CreateSessionRequestPayload;

    // Validate required fields
    if (!body.topic?.trim()) {
      return NextResponse.json(
        { error: 'Inserisci un argomento per la sessione.' } satisfies ApiError,
        { status: 400 },
      );
    }

    if (!body.preferredWeek) {
      return NextResponse.json(
        { error: 'Seleziona la settimana preferita.' } satisfies ApiError,
        { status: 400 },
      );
    }

    if (!body.preferredSlot || !VALID_SLOTS.includes(body.preferredSlot)) {
      return NextResponse.json(
        { error: 'Seleziona una fascia oraria valida.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Validate week is in the future
    const weekDate = new Date(body.preferredWeek);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (weekDate < today) {
      return NextResponse.json(
        { error: 'La settimana deve essere futura.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Errore di configurazione server.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const { data: request, error: insertError } = await admin
      .from('session_requests')
      .insert({
        user_id: user.id,
        topic: body.topic.trim(),
        description: body.description?.trim() || null,
        preferred_week: body.preferredWeek,
        preferred_slot: body.preferredSlot,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert session request error:', insertError);
      return NextResponse.json(
        { error: 'Errore durante la creazione della richiesta.' } satisfies ApiError,
        { status: 500 },
      );
    }

    // Notify admin via email (non-blocking)
    const userName = (user.user_metadata?.full_name as string) || user.email || 'Utente';
    const slotLabels: Record<SessionRequestSlot, string> = {
      mattina: 'Mattina (9:00-12:00)',
      pomeriggio: 'Pomeriggio (14:00-17:00)',
      sera: 'Sera (18:00-20:00)',
    };

    const weekFormatted = weekDate.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const emailData = sessionRequestNotificationEmail({
      userName,
      userEmail: user.email || '',
      topic: body.topic.trim(),
      description: body.description?.trim() || null,
      preferredWeek: weekFormatted,
      preferredSlot: slotLabels[body.preferredSlot],
      requestId: request.id,
    });

    // Send to admin email (configured or fallback)
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@aerabim.it';
    sendEmail({ to: adminEmail, ...emailData }).catch(() => {});

    return NextResponse.json({
      success: true,
      requestId: request.id,
    });
  } catch (err) {
    console.error('Session request POST error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
