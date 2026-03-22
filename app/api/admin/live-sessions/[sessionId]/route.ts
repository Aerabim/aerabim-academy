import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/resend/client';
import { sessionCanceledNotificationEmail } from '@/lib/resend/templates';
import type { LiveSessionStatus, ApiError } from '@/types';

interface RouteParams {
  params: { sessionId: string };
}

const VALID_STATUSES: LiveSessionStatus[] = ['scheduled', 'live', 'ended', 'canceled'];

// ── PATCH: Update session status/details ────────────

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

    const body = (await req.json()) as {
      status?: LiveSessionStatus;
      title?: string;
      description?: string;
      hostName?: string;
      scheduledAt?: string;
      durationMin?: number;
      maxParticipants?: number;
      meetingUrl?: string;
      isPublished?: boolean;
    };

    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: 'Stato non valido.' } satisfies ApiError,
          { status: 400 },
        );
      }
      updateData.status = body.status;
    }

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.hostName !== undefined) updateData.host_name = body.hostName;
    if (body.scheduledAt !== undefined) updateData.scheduled_at = body.scheduledAt;
    if (body.durationMin !== undefined) updateData.duration_min = body.durationMin;
    if (body.maxParticipants !== undefined) updateData.max_participants = body.maxParticipants;
    if (body.meetingUrl !== undefined) updateData.meeting_url = body.meetingUrl;
    if (body.isPublished !== undefined) updateData.is_published = body.isPublished;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nessun campo da aggiornare.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const { error } = await admin
      .from('live_sessions')
      .update(updateData)
      .eq('id', params.sessionId);

    if (error) {
      console.error('Update session error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update session error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

// ── DELETE: Cancel session (soft delete) ─────────────

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

    // Fetch session details before canceling (for notification email)
    const { data: session } = await admin
      .from('live_sessions')
      .select('title, scheduled_at')
      .eq('id', params.sessionId)
      .single();

    const { error } = await admin
      .from('live_sessions')
      .update({ status: 'canceled', is_published: false })
      .eq('id', params.sessionId);

    if (error) {
      console.error('Cancel session error:', error);
      return NextResponse.json(
        { error: 'Errore durante la cancellazione.' } satisfies ApiError,
        { status: 500 },
      );
    }

    // Notify booked users (non-blocking)
    if (session) {
      notifyBookedUsers(admin, params.sessionId, session.title, session.scheduled_at).catch(
        (err) => console.error('[admin/live-sessions] Errore notifica cancellazione:', err),
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Cancel session error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

// ── Notify booked users about cancellation ───────────

async function notifyBookedUsers(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  sessionId: string,
  sessionTitle: string,
  scheduledAt: string,
) {
  const { data: bookings } = await admin
    .from('live_session_bookings')
    .select('user_id')
    .eq('session_id', sessionId)
    .eq('status', 'confirmed');

  if (!bookings || bookings.length === 0) return;

  const userIds = bookings.map((b) => b.user_id);
  const userMap = new Map<string, { email: string; name: string }>();
  let page = 1;
  const PAGE_SIZE = 50;
  let hasMore = true;

  while (hasMore && userMap.size < userIds.length) {
    const { data: usersData } = await admin.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });

    if (!usersData?.users.length) break;

    for (const authUser of usersData.users) {
      if (userIds.includes(authUser.id) && authUser.email) {
        const name = (authUser.user_metadata?.full_name as string) || authUser.email;
        userMap.set(authUser.id, { email: authUser.email, name });
      }
    }

    hasMore = usersData.users.length === PAGE_SIZE;
    page++;
  }

  const usersToNotify = Array.from(userMap.values());
  for (const user of usersToNotify) {
    const { subject, html } = sessionCanceledNotificationEmail({
      userName: user.name,
      sessionTitle,
      scheduledAt,
    });

    await sendEmail({ to: user.email, subject, html });
  }
}
