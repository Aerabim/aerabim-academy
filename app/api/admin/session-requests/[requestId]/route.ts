import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/resend/client';
import {
  sessionRequestConfirmedEmail,
  sessionRequestProposedEmail,
  sessionRequestDeclinedEmail,
} from '@/lib/resend/templates';
import type { ApiError, RespondSessionRequestPayload } from '@/types';

interface RouteParams {
  params: { requestId: string };
}

// ── PATCH: Admin responds to a session request ────────

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Devi effettuare il login.' } satisfies ApiError,
        { status: 401 },
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const profileRow = profile as { role: string } | null;
    if (!profileRow || profileRow.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accesso non autorizzato.' } satisfies ApiError,
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

    const body = (await req.json()) as RespondSessionRequestPayload;

    if (!['confirmed', 'proposed', 'declined'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Stato non valido.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Fetch the request
    const { data: sessionRequest } = await admin
      .from('session_requests')
      .select('id, user_id, topic, preferred_week, preferred_slot, status')
      .eq('id', params.requestId)
      .single();

    if (!sessionRequest) {
      return NextResponse.json(
        { error: 'Richiesta non trovata.' } satisfies ApiError,
        { status: 404 },
      );
    }

    if (sessionRequest.status !== 'pending' && sessionRequest.status !== 'proposed') {
      return NextResponse.json(
        { error: 'Questa richiesta non può essere modificata.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Update the request
    const updateData: Record<string, unknown> = {
      status: body.status,
      admin_note: body.adminNote || null,
      updated_at: new Date().toISOString(),
    };

    if (body.status === 'confirmed' && body.sessionId) {
      updateData.session_id = body.sessionId;
    }

    const { error: updateError } = await admin
      .from('session_requests')
      .update(updateData)
      .eq('id', params.requestId);

    if (updateError) {
      console.error('Update session request error:', updateError);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento.' } satisfies ApiError,
        { status: 500 },
      );
    }

    // Send notification email to user (non-blocking)
    const { data: usersData } = await admin.auth.admin.getUserById(sessionRequest.user_id);
    const authUser = usersData?.user;

    if (authUser?.email) {
      const userName = (authUser.user_metadata?.full_name as string) || authUser.email;

      let emailData: { subject: string; html: string } | null = null;

      if (body.status === 'confirmed') {
        emailData = sessionRequestConfirmedEmail({
          userName,
          topic: sessionRequest.topic,
          adminNote: body.adminNote || null,
          sessionId: body.sessionId || null,
        });
      } else if (body.status === 'proposed') {
        emailData = sessionRequestProposedEmail({
          userName,
          topic: sessionRequest.topic,
          adminNote: body.adminNote || '',
          proposedDate: body.proposedDate || '',
          proposedSlot: body.proposedSlot || sessionRequest.preferred_slot,
        });
      } else if (body.status === 'declined') {
        emailData = sessionRequestDeclinedEmail({
          userName,
          topic: sessionRequest.topic,
          adminNote: body.adminNote || null,
        });
      }

      if (emailData) {
        sendEmail({ to: authUser.email, ...emailData }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin session request PATCH error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
