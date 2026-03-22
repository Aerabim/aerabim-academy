import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/resend/client';
import { sessionReminderEmail } from '@/lib/resend/templates';

export const dynamic = 'force-dynamic';

/**
 * Cron job: sends reminder emails to users who have a confirmed booking
 * for a live session starting within the next hour.
 *
 * Triggered by Vercel Cron every 15 minutes.
 * Protected by CRON_SECRET to prevent unauthorized access.
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Database admin non configurato' }, { status: 503 });
  }

  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find sessions starting within the next hour that are still scheduled or live
    const { data: sessions, error: sessionsError } = await admin
      .from('live_sessions')
      .select('id, title, scheduled_at, type')
      .in('status', ['scheduled', 'live'])
      .eq('is_published', true)
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', oneHourFromNow.toISOString());

    if (sessionsError) {
      console.error('[cron/session-reminders] Errore query sessioni:', sessionsError);
      return NextResponse.json({ error: 'Errore query sessioni' }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ sent: 0, message: 'Nessuna sessione imminente' });
    }

    const sessionIds = sessions.map((s) => s.id);

    // Find bookings that haven't received a reminder yet
    const { data: bookings, error: bookingsError } = await admin
      .from('live_session_bookings')
      .select('id, session_id, user_id')
      .in('session_id', sessionIds)
      .eq('status', 'confirmed')
      .eq('reminder_sent', false);

    if (bookingsError) {
      console.error('[cron/session-reminders] Errore query bookings:', bookingsError);
      return NextResponse.json({ error: 'Errore query bookings' }, { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ sent: 0, message: 'Nessun reminder da inviare' });
    }

    // Fetch user emails for all bookings (paginated — listUsers returns max 50 per page)
    const userIds = Array.from(new Set(bookings.map((b) => b.user_id)));
    const userMap = new Map<string, { email: string; name: string }>();
    let page = 1;
    const PAGE_SIZE = 50;
    let hasMore = true;

    while (hasMore && userMap.size < userIds.length) {
      const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
        page,
        perPage: PAGE_SIZE,
      });

      if (usersError || !usersData?.users.length) {
        if (usersError) {
          console.error('[cron/session-reminders] Errore fetch utenti:', usersError);
        }
        break;
      }

      for (const authUser of usersData.users) {
        if (userIds.includes(authUser.id) && authUser.email) {
          const fullName = (authUser.user_metadata?.full_name as string) || authUser.email;
          userMap.set(authUser.id, { email: authUser.email, name: fullName });
        }
      }

      hasMore = usersData.users.length === PAGE_SIZE;
      page++;
    }

    // Build session lookup
    const sessionMap = new Map(sessions.map((s) => [s.id, s]));

    // Send reminders
    let sentCount = 0;
    const bookingIdsToUpdate: string[] = [];

    for (const booking of bookings) {
      const user = userMap.get(booking.user_id);
      const session = sessionMap.get(booking.session_id);

      if (!user || !session) continue;

      const { subject, html } = sessionReminderEmail({
        userName: user.name,
        sessionTitle: session.title,
        sessionId: session.id,
      });

      const sent = await sendEmail({ to: user.email, subject, html });

      if (sent) {
        sentCount++;
        bookingIdsToUpdate.push(booking.id);
      }
    }

    // Mark reminders as sent
    if (bookingIdsToUpdate.length > 0) {
      const { error: updateError } = await admin
        .from('live_session_bookings')
        .update({ reminder_sent: true })
        .in('id', bookingIdsToUpdate);

      if (updateError) {
        console.error('[cron/session-reminders] Errore aggiornamento reminder_sent:', updateError);
      }
    }

    console.log(`[cron/session-reminders] Inviati ${sentCount}/${bookings.length} reminder`);
    return NextResponse.json({ sent: sentCount, total: bookings.length });
  } catch (err: unknown) {
    console.error('[cron/session-reminders] Errore imprevisto:', err);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
