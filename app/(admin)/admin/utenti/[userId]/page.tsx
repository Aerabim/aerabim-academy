export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/Badge';
import { UserDetail } from '@/components/admin/users/UserDetail';
import type { UserRole, UserPlan } from '@/types';

const ROLE_BADGE_MAP: Record<UserRole, { label: string; variant: 'cyan' | 'amber' | 'emerald' | 'violet' | 'rose' }> = {
  student: { label: 'Membro', variant: 'violet' },
  docente: { label: 'Docente', variant: 'cyan' },
  tutor: { label: 'Tutor', variant: 'emerald' },
  moderatore: { label: 'Moderatore', variant: 'rose' },
  admin: { label: 'Admin', variant: 'amber' },
};

interface PageProps {
  params: { userId: string };
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const admin = getSupabaseAdmin();
  if (!admin) redirect('/admin/utenti');

  // Fetch user from auth
  const { data: authData, error: authError } = await admin.auth.admin.getUserById(params.userId);
  if (authError || !authData?.user) redirect('/admin/utenti');

  const authUser = authData.user;

  // Fetch profile
  const { data: profile } = await admin
    .from('profiles')
    .select('role, display_name')
    .eq('id', params.userId)
    .maybeSingle() as { data: { role: string; display_name: string | null } | null };

  // Fetch subscription
  const { data: subscription } = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', params.userId)
    .eq('status', 'active')
    .maybeSingle();

  // Fetch enrollments
  const { data: enrollmentsRaw } = await admin
    .from('enrollments')
    .select('id, course_id, access_type, expires_at, created_at')
    .eq('user_id', params.userId)
    .order('created_at', { ascending: false });

  const enrollments = (enrollmentsRaw ?? []) as {
    id: string; course_id: string; access_type: string;
    expires_at: string | null; created_at: string;
  }[];

  // Fetch course titles
  const courseIds = Array.from(new Set(enrollments.map((e) => e.course_id)));
  const { data: coursesRaw } = await admin
    .from('courses')
    .select('id, title')
    .in('id', courseIds.length > 0 ? courseIds : ['']);

  const courseMap = new Map(
    ((coursesRaw ?? []) as { id: string; title: string }[]).map((c) => [c.id, c.title]),
  );

  // Fetch certificates
  const { data: certificates } = await admin
    .from('certificates')
    .select('id, course_id, certificate_number, issued_at')
    .eq('user_id', params.userId)
    .order('issued_at', { ascending: false });

  const enrichedEnrollments = enrollments.map((e) => ({
    id: e.id,
    courseId: e.course_id,
    courseTitle: courseMap.get(e.course_id) ?? 'Corso',
    accessType: e.access_type,
    expiresAt: e.expires_at,
    createdAt: e.created_at,
  }));

  const enrichedCertificates = ((certificates ?? []) as {
    id: string; course_id: string; certificate_number: string; issued_at: string;
  }[]).map((c) => ({
    id: c.id,
    courseTitle: courseMap.get(c.course_id) ?? 'Corso',
    certificateNumber: c.certificate_number,
    issuedAt: c.issued_at,
  }));

  const userData = {
    id: authUser.id,
    email: authUser.email ?? '',
    fullName: (authUser.user_metadata?.full_name as string) ?? profile?.display_name ?? 'Utente',
    role: (profile?.role ?? 'student') as UserRole,
    plan: (subscription ? (subscription as { plan: string }).plan : 'free') as UserPlan,
    createdAt: authUser.created_at,
  };

  return (
    <div className="p-6 lg:p-10 w-full space-y-8">
      <div>
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">
          {userData.fullName}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[0.82rem] text-text-muted">{userData.email}</span>
          <Badge variant={(ROLE_BADGE_MAP[userData.role] ?? ROLE_BADGE_MAP.student).variant}>
            {(ROLE_BADGE_MAP[userData.role] ?? ROLE_BADGE_MAP.student).label}
          </Badge>
        </div>
      </div>

      <UserDetail
        user={userData}
        enrollments={enrichedEnrollments}
        certificates={enrichedCertificates}
      />
    </div>
  );
}
