import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ApiError } from '@/types';

interface VerifyAdminSuccess {
  userId: string;
  admin: SupabaseClient;
}

/**
 * Verifies the current user is authenticated and has the 'admin' role.
 * Returns the userId and admin (service_role) Supabase client on success,
 * or a NextResponse error to return immediately on failure.
 *
 * Usage in API routes:
 * ```ts
 * const result = await verifyAdmin();
 * if (result instanceof NextResponse) return result;
 * const { userId, admin } = result;
 * ```
 */
export async function verifyAdmin(): Promise<VerifyAdminSuccess | NextResponse> {
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

  return { userId: user.id, admin };
}
