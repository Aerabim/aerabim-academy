import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

/** GET /api/admin/users — list all users with profile + subscription info */
export async function GET(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const perPage = parseInt(searchParams.get('perPage') ?? '50', 10);

    // Get auth users
    const { data: authData, error: authError } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (authError || !authData) {
      console.error('List users error:', authError);
      return NextResponse.json(
        { error: 'Errore nel recupero degli utenti.' } satisfies ApiError,
        { status: 500 },
      );
    }

    let users = authData.users;

    // Filter by search if provided
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(
        (u) =>
          (u.email ?? '').toLowerCase().includes(q) ||
          ((u.user_metadata?.full_name as string) ?? '').toLowerCase().includes(q),
      );
    }

    const userIds = users.map((u) => u.id);

    // Fetch profiles and subscriptions
    const [profilesRes, subsRes, enrollCountRes] = await Promise.all([
      admin.from('profiles').select('id, role, display_name').in('id', userIds.length > 0 ? userIds : ['']),
      admin.from('subscriptions').select('user_id, plan, status').in('user_id', userIds.length > 0 ? userIds : ['']).eq('status', 'active'),
      admin.from('enrollments').select('user_id').in('user_id', userIds.length > 0 ? userIds : ['']),
    ]);

    const profileMap = new Map(
      ((profilesRes.data ?? []) as { id: string; role: string; display_name: string | null }[])
        .map((p) => [p.id, p]),
    );

    const subMap = new Map(
      ((subsRes.data ?? []) as { user_id: string; plan: string; status: string }[])
        .map((s) => [s.user_id, s.plan]),
    );

    const enrollCountMap = new Map<string, number>();
    for (const e of (enrollCountRes.data ?? []) as { user_id: string }[]) {
      enrollCountMap.set(e.user_id, (enrollCountMap.get(e.user_id) ?? 0) + 1);
    }

    const enriched = users.map((u) => {
      const profile = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email ?? '',
        fullName: (u.user_metadata?.full_name as string) ?? profile?.display_name ?? 'Utente',
        role: (profile?.role ?? 'student') as 'student' | 'admin',
        plan: (subMap.get(u.id) ?? 'free') as 'free' | 'pro' | 'team' | 'pa',
        enrollmentCount: enrollCountMap.get(u.id) ?? 0,
        createdAt: u.created_at,
      };
    });

    return NextResponse.json({
      users: enriched,
      total: authData.total ?? users.length,
    });
  } catch (err) {
    console.error('GET /api/admin/users error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
