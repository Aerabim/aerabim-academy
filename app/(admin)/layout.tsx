import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/AdminShell';
import { getInitials } from '@/lib/utils';
import type { DashboardUser } from '@/types';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const fullName = (user.user_metadata?.full_name as string) || user.email || 'Admin';

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
    // default to student
  }

  if (role !== 'admin') {
    redirect('/dashboard');
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
    // default to free
  }

  const adminUser: DashboardUser = {
    fullName,
    email: user.email || '',
    initials: getInitials(fullName),
    role,
    plan,
  };

  return <AdminShell user={adminUser}>{children}</AdminShell>;
}
