import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { getInitials } from '@/lib/utils';
import type { DashboardUser } from '@/types';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const fullName = (user.user_metadata?.full_name as string) || user.email || 'Utente';

  // Fetch profile role and active subscription
  let role: DashboardUser['role'] = 'student';
  let plan: DashboardUser['plan'] = 'free';
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    if (profile) {
      role = profile.role as DashboardUser['role'];
    }
  } catch {
    // Default to student
  }

  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle() as { data: { plan: string; status: string } | null };

    if (subscription) {
      plan = subscription.plan as DashboardUser['plan'];
    }
  } catch {
    // Default to free if subscriptions table not available
  }

  // Fetch published course count for sidebar badge
  let courseCount = 0;
  try {
    const { count } = await supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('published', true);
    courseCount = count ?? 0;
  } catch {
    // Default to 0 if courses table not available
  }

  const dashboardUser: DashboardUser = {
    fullName,
    email: user.email || '',
    initials: getInitials(fullName),
    role,
    plan,
  };

  return (
    <DashboardShell user={dashboardUser} courseCount={courseCount}>
      {children}
    </DashboardShell>
  );
}
