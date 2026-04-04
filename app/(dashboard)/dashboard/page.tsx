import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { ContinueStudying } from '@/components/dashboard/ContinueStudying';
import { WeeklyActivity } from '@/components/dashboard/WeeklyActivity';
import { Achievements } from '@/components/dashboard/Achievements';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { LearningPaths } from '@/components/dashboard/LearningPaths';
import type { DashboardLearningPath } from '@/components/dashboard/LearningPaths';
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
  let learningPaths: DashboardLearningPath[] = [];

  try {
    const admin = getSupabaseAdmin();

    [stats, continueCourses, weeklyActivity, upcomingSessions, badges] = await Promise.all([
      getDashboardStats(supabase, user.id),
      getContinueStudyingCourses(supabase, user.id),
      getWeeklyActivity(supabase, user.id),
      getUpcomingLiveSessions(supabase),
      getUserBadges(supabase, user.id),
    ]);

    // Fetch top 3 published paths for the widget
    if (admin) {
      const { data: pathsData } = await admin
        .from('learning_paths')
        .select('id, slug, title, target_role, level, estimated_hours')
        .eq('is_published', true)
        .order('order_num', { ascending: true })
        .limit(3);

      const rawPaths = (pathsData ?? []) as {
        id: string; slug: string; title: string; target_role: string | null;
        level: string | null; estimated_hours: number | null;
      }[];

      if (rawPaths.length > 0) {
        const pathIds = rawPaths.map((p) => p.id);

        const [stepsRes, lppRes] = await Promise.all([
          admin.from('learning_path_steps').select('path_id').in('path_id', pathIds),
          admin.from('learning_path_progress')
            .select('path_id, is_completed')
            .eq('user_id', user.id)
            .in('path_id', pathIds),
        ]);

        const stepCounts = new Map<string, number>();
        for (const s of (stepsRes.data ?? []) as { path_id: string }[]) {
          stepCounts.set(s.path_id, (stepCounts.get(s.path_id) ?? 0) + 1);
        }

        const completedPaths = new Set(
          ((lppRes.data ?? []) as { path_id: string; is_completed: boolean }[])
            .filter((r) => r.is_completed)
            .map((r) => r.path_id),
        );

        learningPaths = rawPaths.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          targetRole: p.target_role,
          level: p.level as DashboardLearningPath['level'],
          stepCount: stepCounts.get(p.id) ?? 0,
          estimatedHours: p.estimated_hours,
          isCompleted: completedPaths.has(p.id),
        }));
      }
    }
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

      <div className="animate-fadeIn" style={{ animationDelay: '0.30s' }}>
        <LearningPaths paths={learningPaths} />
      </div>
    </div>
  );
}
