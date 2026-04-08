export const dynamic = 'force-dynamic';

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAdminOverviewStats } from '@/lib/admin/queries';
import { StatCard } from '@/components/admin/ui/StatCard';
import { PendingAlert } from '@/components/admin/overview/PendingAlert';
import { QuickActions } from '@/components/admin/overview/QuickActions';
import { ActivityFeed } from '@/components/admin/overview/ActivityFeed';
import { DraftCourses } from '@/components/admin/overview/DraftCourses';
import { TopCourses } from '@/components/admin/overview/TopCourses';
import { createServerClient } from '@/lib/supabase/server';

export default async function AdminOverviewPage() {
  const admin = getSupabaseAdmin();

  // Greeting: fetch user name
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const firstName = ((user?.user_metadata?.full_name as string) || '').split(' ')[0] || 'Admin';

  const stats = admin
    ? await getAdminOverviewStats(admin)
    : {
        totalUsers: 0,
        activeEnrollments: 0,
        publishedCourses: 0,
        totalCourses: 0,
        pendingSessionRequests: 0,
        newUsersThisWeek: 0,
        newEnrollmentsThisWeek: 0,
        activityFeed: [],
        draftCourses: [],
        topCourses: [],
        recentEnrollments: [],
      };

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Buongiorno' :
    hour < 18 ? 'Buon pomeriggio' :
                'Buonasera';

  const dateLabel = now.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-6 lg:p-10 w-full space-y-7">

      {/* ── Greeting ── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[0.75rem] text-text-muted capitalize">{dateLabel}</p>
          <h1 className="text-[1.6rem] font-heading font-bold text-text-primary mt-0.5">
            {greeting}, {firstName}
          </h1>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[0.72rem] text-text-muted bg-surface-1 border border-border-subtle px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
          Piattaforma attiva
        </span>
      </div>

      {/* ── Pending alert (conditional) ── */}
      <PendingAlert count={stats.pendingSessionRequests} />

      {/* ── Quick actions ── */}
      <QuickActions />

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Utenti totali"
          value={stats.totalUsers}
          accent="cyan"
          delta={{ value: stats.newUsersThisWeek, label: 'questa settimana' }}
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
        <StatCard
          label="Iscrizioni attive"
          value={stats.activeEnrollments}
          accent="emerald"
          delta={{ value: stats.newEnrollmentsThisWeek, label: 'questa settimana' }}
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          }
        />
        <StatCard
          label="Corsi pubblicati"
          value={`${stats.publishedCourses} / ${stats.totalCourses}`}
          accent="violet"
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          }
        />
        <StatCard
          label="Richieste pendenti"
          value={stats.pendingSessionRequests}
          accent="amber"
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
        />
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

        {/* Left — activity feed */}
        <ActivityFeed events={stats.activityFeed} />

        {/* Right — draft courses + top courses */}
        <div className="flex flex-col gap-6">
          <DraftCourses courses={stats.draftCourses} />
          <TopCourses courses={stats.topCourses} />
        </div>

      </div>
    </div>
  );
}
