import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getUserNotifications, getUnreadCount } from '@/lib/notifications/queries';
import { NotificationList } from '@/components/notifications/NotificationList';

export default async function NotifichePage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(supabase, user.id),
    getUnreadCount(supabase, user.id),
  ]);

  return (
    <div className="p-6 lg:p-9 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Notifiche</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-text-muted mt-1">
              {unreadCount} da leggere
            </p>
          )}
        </div>
      </div>

      <NotificationList initialNotifications={notifications} initialUnread={unreadCount} />
    </div>
  );
}
