import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, GrantEnrollmentPayload } from '@/types';

/** GET /api/admin/enrollments — list all enrollments */
export async function GET(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    let query = admin
      .from('enrollments')
      .select('id, user_id, course_id, access_type, expires_at, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('List enrollments error:', error);
      return NextResponse.json(
        { error: 'Errore nel recupero delle iscrizioni.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const enrollments = (data ?? []) as {
      id: string; user_id: string; course_id: string;
      access_type: string; expires_at: string | null; created_at: string;
    }[];

    // Enrich with user and course names
    const userIds = Array.from(new Set(enrollments.map((e) => e.user_id)));
    const courseIds = Array.from(new Set(enrollments.map((e) => e.course_id)));

    const [usersRes, coursesRes, emailsRes] = await Promise.all([
      admin.from('profiles').select('id, display_name').in('id', userIds.length > 0 ? userIds : ['']),
      admin.from('courses').select('id, title').in('id', courseIds.length > 0 ? courseIds : ['']),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    const userNameMap = new Map(
      ((usersRes.data ?? []) as { id: string; display_name: string | null }[])
        .map((u) => [u.id, u.display_name ?? 'Utente']),
    );
    const courseMap = new Map(
      ((coursesRes.data ?? []) as { id: string; title: string }[])
        .map((c) => [c.id, c.title]),
    );
    const emailMap = new Map<string, string>();
    if (emailsRes.data?.users) {
      for (const u of emailsRes.data.users) {
        emailMap.set(u.id, u.email ?? '');
      }
    }

    const enriched = enrollments.map((e) => ({
      id: e.id,
      userId: e.user_id,
      userEmail: emailMap.get(e.user_id) ?? '',
      userName: userNameMap.get(e.user_id) ?? 'Utente',
      courseId: e.course_id,
      courseTitle: courseMap.get(e.course_id) ?? 'Corso',
      accessType: e.access_type,
      expiresAt: e.expires_at,
      createdAt: e.created_at,
    }));

    return NextResponse.json({ enrollments: enriched });
  } catch (err) {
    console.error('GET /api/admin/enrollments error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** POST /api/admin/enrollments — manually grant enrollment */
export async function POST(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = (await req.json()) as GrantEnrollmentPayload;

    if (!body.userId || !body.courseId || !body.accessType) {
      return NextResponse.json(
        { error: 'Campi obbligatori: userId, courseId, accessType.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Check if enrollment already exists
    const { data: existing } = await admin
      .from('enrollments')
      .select('id')
      .eq('user_id', body.userId)
      .eq('course_id', body.courseId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'L\'utente ha già un\'iscrizione a questo corso.' } satisfies ApiError,
        { status: 409 },
      );
    }

    const { data: enrollment, error } = await admin
      .from('enrollments')
      .insert({
        user_id: body.userId,
        course_id: body.courseId,
        access_type: body.accessType,
        expires_at: body.expiresAt ?? null,
      })
      .select('id, user_id, course_id, access_type, expires_at, created_at')
      .single();

    if (error || !enrollment) {
      console.error('Grant enrollment error:', error);
      return NextResponse.json(
        { error: 'Errore durante la concessione dell\'accesso.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/enrollments error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
