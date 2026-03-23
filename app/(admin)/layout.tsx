import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify admin role
  let role = 'student';
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null };

    if (profile) {
      role = profile.role;
    }
  } catch {
    // Default to student
  }

  if (role !== 'admin') {
    redirect('/dashboard');
  }

  return <AdminShell>{children}</AdminShell>;
}
