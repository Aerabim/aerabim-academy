import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasActiveProSubscription } from '@/lib/live/queries';
import { sendEmail } from '@/lib/resend/client';
import { sessionBookingConfirmationEmail } from '@/lib/resend/templates';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { sessionId: string };
}

// ── POST: Book a session ────────────────────────────

export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Devi effettuare il login.' } satisfies ApiError,
        { status: 401 },
      );
    }

    // Verify Pro subscription
    const isPro = await hasActiveProSubscription(supabase, user.id);
    if (!isPro) {
      return NextResponse.json(
        { error: 'Le sessioni live sono riservate agli abbonati Pro.' } satisfies ApiError,
        { status: 403 },
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Errore di configurazione server.' } satisfies ApiError,
        { status: 500 },
      );
    }

    // Fetch session (use admin to bypass RLS for full access)
    const { data: session } = await admin
      .from('live_sessions')
      .select('id, type, title, host_name, scheduled_at, duration_min, max_participants, status, is_published')
      .eq('id', params.sessionId)
      .eq('is_published', true)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Sessione non trovata.' } satisfies ApiError,
        { status: 404 },
      );
    }

    if (session.status === 'ended' || session.status === 'canceled') {
      return NextResponse.json(
        { error: 'Questa sessione non è più disponibile.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Atomic booking with race-condition protection via Postgres function
    const { data: rpcResult, error: bookingError } = await admin
      .rpc('book_live_session', {
        p_session_id: params.sessionId,
        p_user_id: user.id,
      });

    if (bookingError) {
      if (bookingError.message?.includes('SPOTS_FULL')) {
        return NextResponse.json(
          { error: 'Posti esauriti per questa sessione.' } satisfies ApiError,
          { status: 409 },
        );
      }
      console.error('Booking error:', bookingError);
      return NextResponse.json(
        { error: 'Errore durante la prenotazione.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const bookingId = rpcResult as string;

    // Send confirmation email (non-blocking)
    const userName = (user.user_metadata?.full_name as string) || user.email || 'Utente';
    const dateTime = new Date(session.scheduled_at).toLocaleString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const email = sessionBookingConfirmationEmail({
      userName,
      sessionTitle: session.title,
      hostName: session.host_name,
      dateTime,
      sessionId: session.id,
      sessionType: session.type,
    });

    if (user.email) {
      sendEmail({ to: user.email, ...email }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      bookingId,
    });
  } catch (err) {
    console.error('Booking error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

// ── DELETE: Cancel a booking ────────────────────────

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Devi effettuare il login.' } satisfies ApiError,
        { status: 401 },
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Errore di configurazione server.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const { error } = await admin
      .from('live_session_bookings')
      .update({ status: 'canceled' })
      .eq('session_id', params.sessionId)
      .eq('user_id', user.id)
      .eq('status', 'confirmed');

    if (error) {
      console.error('Cancel booking error:', error);
      return NextResponse.json(
        { error: 'Errore durante la cancellazione.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Cancel booking error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
