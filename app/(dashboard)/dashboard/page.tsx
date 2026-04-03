import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { ContinueStudying } from '@/components/dashboard/ContinueStudying';
import { WeeklyActivity } from '@/components/dashboard/WeeklyActivity';
import { Achievements } from '@/components/dashboard/Achievements';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import {
  getDashboardStats,
  getContinueStudyingCourses,
  getWeeklyActivity,
  getUserBadges,
  type WeeklyActivityResult,
} from '@/lib/dashboard/queries';
import { getUpcomingLiveSessions } from '@/lib/live/queries';
import type { LiveSessionDisplay, BadgeInfo } from '@/types';

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
  let weeklyActivity: WeeklyActivityResult = {
    days: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((label) => ({ label, minutes: 0 })),
    prevWeekMinutes: 0,
  };
  let upcomingSessions: LiveSessionDisplay[] = [];
  let badges: BadgeInfo[] = [];

  try {
    [stats, continueCourses, weeklyActivity, upcomingSessions, badges] = await Promise.all([
      getDashboardStats(supabase, user.id),
      getContinueStudyingCourses(supabase, user.id),
      getWeeklyActivity(supabase, user.id),
      getUpcomingLiveSessions(supabase),
      getUserBadges(supabase, user.id),
    ]);
  } catch {
    // Keep defaults on error
  }

  return (
    <div className="w-full px-6 lg:px-9 py-7 space-y-7">
      <div className="animate-fadeIn">
        <WelcomeSection firstName={firstName} lastCourse={continueCourses[0] ?? null} />
      </div>

      <div className="animate-fadeIn" style={{ animationDelay: '0.06s' }}>
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
        <WeeklyActivity days={weeklyActivity.days} prevWeekMinutes={weeklyActivity.prevWeekMinutes} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn" style={{ animationDelay: '0.24s' }}>
        <Achievements badges={badges} />
        <UpcomingEvents sessions={upcomingSessions} />
      </div>
    </div>
  );
}
