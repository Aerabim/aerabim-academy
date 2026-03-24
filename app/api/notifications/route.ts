import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUserNotifications, getUnreadCount } from '@/lib/notifications/queries';

/**
 * GET /api/notifications
 * Returns the user's notifications + unread count.
 */
export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato.' }, { status: 401 });
    }

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(supabase, user.id),
      getUnreadCount(supabase, user.id),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch {
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}
