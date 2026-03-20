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

  const dashboardUser: DashboardUser = {
    fullName,
    email: user.email || '',
    initials: getInitials(fullName),
    plan: 'pro', // placeholder — will be fetched from subscriptions table
  };

  return (
    <DashboardShell user={dashboardUser}>
      {children}
    </DashboardShell>
  );
}
