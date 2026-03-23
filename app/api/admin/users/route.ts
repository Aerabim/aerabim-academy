import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, UserRole, UserPlan, CreateUserPayload } from '@/types';

const VALID_ROLES: UserRole[] = ['student', 'admin', 'docente', 'tutor', 'moderatore'];

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
        role: (profile?.role ?? 'student') as UserRole,
        plan: (subMap.get(u.id) ?? 'free') as UserPlan,
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

/** POST /api/admin/users — create a new user from admin */
export async function POST(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = (await req.json()) as CreateUserPayload;

    if (!body.email || !body.fullName || !body.password) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti: email, fullName, password.' } satisfies ApiError,
        { status: 400 },
      );
    }

    if (body.password.length < 6) {
      return NextResponse.json(
        { error: 'La password deve avere almeno 6 caratteri.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const roleToSet = body.role ?? 'student';
    if (!VALID_ROLES.includes(roleToSet)) {
      return NextResponse.json(
        { error: `Ruolo non valido. Usa: ${VALID_ROLES.join(', ')}.` } satisfies ApiError,
        { status: 400 },
      );
    }

    // Create auth user via Supabase Admin API
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.fullName },
    });

    if (authError || !authData?.user) {
      console.error('Create user auth error:', authError);
      const msg = authError?.message?.includes('already been registered')
        ? 'Questa email è già registrata.'
        : 'Errore durante la creazione dell\'utente.';
      return NextResponse.json(
        { error: msg } satisfies ApiError,
        { status: authError?.message?.includes('already been registered') ? 409 : 500 },
      );
    }

    const newUserId = authData.user.id;

    // Create profile with the specified role
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: newUserId,
        role: roleToSet,
        display_name: body.fullName,
      });

    if (profileError) {
      console.error('Create profile error:', profileError);
      // User was created but profile failed — try to clean up
    }

    // If a non-free plan is specified, create a manual subscription record
    if (body.plan && body.plan !== 'free') {
      const { error: subError } = await admin
        .from('subscriptions')
        .insert({
          user_id: newUserId,
          stripe_subscription_id: `manual_${Date.now()}`,
          stripe_customer_id: `manual_${newUserId}`,
          status: 'active',
          plan: body.plan,
          current_period_end: null,
        });

      if (subError) {
        console.error('Create subscription error:', subError);
      }
    }

    return NextResponse.json({
      user: {
        id: newUserId,
        email: body.email,
        fullName: body.fullName,
        role: roleToSet,
        plan: body.plan ?? 'free',
      },
    }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/users error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
