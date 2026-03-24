import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { markAsRead, markAllAsRead } from '@/lib/notifications/queries';

/**
 * POST /api/notifications/read
 * Body: { notificationId?: string }
 * If notificationId is provided, marks that single notification as read.
 * If omitted, marks ALL unread notifications as read.
 */
export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato.' }, { status: 401 });
    }

    const body = (await req.json()) as { notificationId?: string };

    if (body.notificationId) {
      await markAsRead(supabase, body.notificationId);
    } else {
      await markAllAsRead(supabase, user.id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}
