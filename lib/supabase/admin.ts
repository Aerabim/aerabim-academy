import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let adminInstance: SupabaseClient | null = null;

/**
 * Returns a Supabase client with service_role privileges (bypasses RLS).
 * Used ONLY in webhook routes for writing to enrollments/subscriptions.
 * Returns null if SUPABASE_SERVICE_ROLE_KEY is not configured.
 *
 * Note: untyped client — table types will be enforced when DB is fully set up.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  if (!adminInstance) {
    adminInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  return adminInstance;
}
