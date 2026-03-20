import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { BimAlertBanner } from '@/components/dashboard/BimAlertBanner';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { ContinueStudying } from '@/components/dashboard/ContinueStudying';
import { WeeklyActivity } from '@/components/dashboard/WeeklyActivity';
import { LearningPaths } from '@/components/dashboard/LearningPaths';
import { Achievements } from '@/components/dashboard/Achievements';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';

export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const fullName = (user.user_metadata?.full_name as string) || user.email || 'Utente';
  const firstName = fullName.split(' ')[0];

  return (
    <div className="w-full px-6 lg:px-9 py-7 space-y-7">
      <div className="animate-fadeIn">
        <WelcomeSection firstName={firstName} />
      </div>

      <div className="animate-fadeIn" style={{ animationDelay: '0.06s' }}>
        <BimAlertBanner />
      </div>

      <div className="animate-fadeIn" style={{ animationDelay: '0.12s' }}>
        <StatsGrid />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 animate-fadeIn" style={{ animationDelay: '0.18s' }}>
        <ContinueStudying />
        <WeeklyActivity />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fadeIn" style={{ animationDelay: '0.24s' }}>
        <LearningPaths />
        <Achievements />
        <UpcomingEvents />
      </div>
    </div>
  );
}
