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
import {
  getDashboardStats,
  getContinueStudyingCourses,
  getWeeklyActivity,
} from '@/lib/dashboard/queries';
import { getUpcomingLiveSessions } from '@/lib/live/queries';
import type { LiveSessionDisplay } from '@/types';

export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const fullName = (user.user_metadata?.full_name as string) || user.email || 'Utente';
  const firstName = fullName.split(' ')[0];

  // Fetch dashboard data in parallel
  let stats = {
    activeCourses: 0,
    totalCourses: 0,
    studyHours: 0,
    quizzesPassed: 0,
    avgScore: 0,
    certificates: 0,
  };
  let continueCourses: Awaited<ReturnType<typeof getContinueStudyingCourses>> = [];
  let weeklyDays: Awaited<ReturnType<typeof getWeeklyActivity>> = [
    { label: 'Lun', minutes: 0 },
    { label: 'Mar', minutes: 0 },
    { label: 'Mer', minutes: 0 },
    { label: 'Gio', minutes: 0 },
    { label: 'Ven', minutes: 0 },
    { label: 'Sab', minutes: 0 },
    { label: 'Dom', minutes: 0 },
  ];
  let upcomingSessions: LiveSessionDisplay[] = [];

  try {
    [stats, continueCourses, weeklyDays, upcomingSessions] = await Promise.all([
      getDashboardStats(supabase, user.id),
      getContinueStudyingCourses(supabase, user.id),
      getWeeklyActivity(supabase, user.id),
      getUpcomingLiveSessions(supabase),
    ]);
  } catch {
    // Keep defaults on error
  }

  return (
    <div className="w-full px-6 lg:px-9 py-7 space-y-7">
      <div className="animate-fadeIn">
        <WelcomeSection firstName={firstName} />
      </div>

      <div className="animate-fadeIn" style={{ animationDelay: '0.06s' }}>
        <BimAlertBanner />
      </div>

      <div className="animate-fadeIn" style={{ animationDelay: '0.12s' }}>
        <StatsGrid
          activeCourses={stats.activeCourses}
          totalCourses={stats.totalCourses}
          studyHours={stats.studyHours}
          quizzesPassed={stats.quizzesPassed}
          avgScore={stats.avgScore}
          certificates={stats.certificates}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 animate-fadeIn" style={{ animationDelay: '0.18s' }}>
        <ContinueStudying courses={continueCourses} />
        <WeeklyActivity days={weeklyDays} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fadeIn" style={{ animationDelay: '0.24s' }}>
        <LearningPaths />
        <Achievements />
        <UpcomingEvents sessions={upcomingSessions} />
      </div>
    </div>
  );
}
