import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { Promotion, ApiError } from '@/types';

/**
 * GET /api/promotions/active?type=banner|popup
 *
 * Returns the first active promotion matching the given type and targeting rules.
 * Uses service_role to query (avoids typed-client mismatch with new table).
 * Active/date filtering is done explicitly in the query.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type !== 'banner' && type !== 'popup') {
    return NextResponse.json(
      { error: 'Parametro type mancante o non valido (banner | popup).' } satisfies ApiError,
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ promotion: null });
  }

  try {
    // Determine user state for audience targeting
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isLoggedIn = !!user;
    let hasSubscription = false;

    if (user) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      hasSubscription = !!sub;
    }

    const now = new Date().toISOString();

    const { data, error } = await admin
      .from('promotions')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const promos = (data ?? []) as Promotion[];

    // Apply audience targeting
    const matched = promos.find((p) => {
      if (p.target_audience === 'all') return true;
      if (p.target_audience === 'logged_out') return !isLoggedIn;
      if (p.target_audience === 'logged_in') return isLoggedIn;
      if (p.target_audience === 'no_subscription') return isLoggedIn && !hasSubscription;
      return false;
    });

    return NextResponse.json({ promotion: matched ?? null });
  } catch (err) {
    console.error('GET /api/promotions/active error:', err);
    return NextResponse.json(
      { error: 'Errore nel recupero della promozione.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
