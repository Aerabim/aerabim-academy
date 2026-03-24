import type { SupabaseClient } from '@supabase/supabase-js';
import type { Notification } from '@/types';

/**
 * Fetches notifications for the current user, newest first.
 */
export async function getUserNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit = 50,
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Notification fetch error:', error);
    return [];
  }

  return (data ?? []) as Notification[];
}

/**
 * Returns the count of unread notifications for a user.
 */
export async function getUnreadCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Unread count error:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Marks a single notification as read.
 */
export async function markAsRead(
  supabase: SupabaseClient,
  notificationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Mark as read error:', error);
  }
}

/**
 * Marks all notifications as read for a user.
 */
export async function markAllAsRead(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Mark all as read error:', error);
  }
}
