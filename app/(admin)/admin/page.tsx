import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAdminOverviewStats } from '@/lib/admin/queries';
import { StatCard } from '@/components/admin/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { timeAgo } from '@/lib/utils';

export default async function AdminOverviewPage() {
  const admin = getSupabaseAdmin();

  const stats = admin
    ? await getAdminOverviewStats(admin)
    : {
        totalUsers: 0,
        activeEnrollments: 0,
        publishedCourses: 0,
        totalCourses: 0,
        pendingSessionRequests: 0,
        recentEnrollments: [],
      };

  return (
    <div className="p-6 lg:p-10 w-full space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-[1.5rem] font-heading font-bold text-text-primary">
          Pannello Admin
        </h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">
          Panoramica della piattaforma AerACADEMY.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Utenti totali"
          value={stats.totalUsers}
          accent="cyan"
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
          label="Richieste sessioni"
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

      {/* Recent enrollments */}
      <div>
        <h2 className="text-[1rem] font-heading font-semibold text-text-primary mb-4">
          Iscrizioni recenti
        </h2>
        {stats.recentEnrollments.length === 0 ? (
          <div className="bg-surface-1 border border-border-subtle rounded-lg p-6 text-center text-[0.82rem] text-text-muted">
            Nessuna iscrizione recente.
          </div>
        ) : (
          <div className="bg-surface-1 border border-border-subtle rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-2/50">
                  <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Utente</th>
                  <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Corso</th>
                  <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Tipo</th>
                  <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Data</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEnrollments.map((enrollment) => (
                  <tr
                    key={enrollment.id}
                    className="border-b border-border-subtle last:border-b-0 hover:bg-surface-2/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-[0.82rem] text-text-primary font-medium">{enrollment.userName}</div>
                      <div className="text-[0.7rem] text-text-muted">{enrollment.userEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] text-text-secondary">
                      {enrollment.courseTitle}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={enrollment.accessType === 'pro_subscription' ? 'cyan' : enrollment.accessType === 'free' ? 'emerald' : 'amber'}>
                        {enrollment.accessType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[0.78rem] text-text-muted">
                      {timeAgo(enrollment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
