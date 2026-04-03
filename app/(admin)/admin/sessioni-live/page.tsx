export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/Badge';
import { SessionAdminTable } from '@/components/admin/sessions/SessionAdminTable';

export default async function AdminLiveSessionsPage() {
  const admin = getSupabaseAdmin();
  let sessions: {
    id: string; type: string; title: string; hostName: string;
    scheduledAt: string; status: string; isPublished: boolean; bookingCount: number;
  }[] = [];

  if (admin) {
    try {
      const { data } = await admin
        .from('live_sessions')
        .select('id, type, title, host_name, scheduled_at, status, is_published, created_at')
        .order('scheduled_at', { ascending: false });

      const raw = (data ?? []) as {
        id: string; type: string; title: string; host_name: string;
        scheduled_at: string; status: string; is_published: boolean; created_at: string;
      }[];

      const sessionIds = raw.map((s) => s.id);
      const { data: bookings } = await admin
        .from('live_session_bookings')
        .select('session_id')
        .in('session_id', sessionIds.length > 0 ? sessionIds : ['']);

      const bookingCountMap = new Map<string, number>();
      for (const b of (bookings ?? []) as { session_id: string }[]) {
        bookingCountMap.set(b.session_id, (bookingCountMap.get(b.session_id) ?? 0) + 1);
      }

      sessions = raw.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        hostName: s.host_name,
        scheduledAt: s.scheduled_at,
        status: s.status,
        isPublished: s.is_published,
        bookingCount: bookingCountMap.get(s.id) ?? 0,
      }));
    } catch (err) {
      console.error('Admin live sessions error:', err);
    }
  }

  return (
    <div className="p-6 lg:p-10 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">Aule Virtuali</h1>
          <p className="text-[0.82rem] text-text-secondary mt-1">Gestisci webinar e sessioni di mentoring.</p>
        </div>
        <Link
          href="/admin/sessioni-live/nuovo"
          className="px-4 py-2 bg-accent-cyan/15 text-accent-cyan text-[0.8rem] font-semibold rounded-md border border-accent-cyan/20 hover:bg-accent-cyan/25 transition-colors"
        >
          + Nuova sessione
        </Link>
      </div>
      <SessionAdminTable sessions={sessions} />
    </div>
  );
}
