import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationType } from '@/types';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
}

/**
 * Creates a notification record. Requires an admin (service_role) Supabase client.
 * Failures are logged but never thrown — notifications must not block primary flows.
 */
export async function createNotification(
  admin: SupabaseClient,
  params: CreateNotificationParams,
): Promise<void> {
  const { error } = await admin.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    href: params.href ?? null,
  });

  if (error) {
    console.error('Notification create error:', error);
  }
}

/**
 * Creates notifications for multiple users at once (e.g. admin broadcast).
 */
export async function createBulkNotifications(
  admin: SupabaseClient,
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>,
): Promise<void> {
  if (userIds.length === 0) return;

  const rows = userIds.map((userId) => ({
    user_id: userId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    href: params.href ?? null,
  }));

  const { error } = await admin.from('notifications').insert(rows);

  if (error) {
    console.error('Bulk notification create error:', error);
  }
}
