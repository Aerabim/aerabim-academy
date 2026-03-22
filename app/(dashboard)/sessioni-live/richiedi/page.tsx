import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { hasActiveProSubscription } from '@/lib/live/queries';
import { ProGate } from '@/components/live/ProGate';
import { RequestSessionPage } from './RequestSessionPage';
import Link from 'next/link';
import type { SessionRequest, SessionRequestDisplay } from '@/types';

export default async function RichiediSessionePage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const isPro = await hasActiveProSubscription(supabase, user.id);

  // Fetch user's existing requests
  const { data: requests } = await supabase
    .from('session_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const rows = (requests ?? []) as unknown as SessionRequest[];
  const userRequests: SessionRequestDisplay[] = rows.map((r) => ({
    id: r.id,
    topic: r.topic,
    description: r.description,
    preferredWeek: r.preferred_week,
    preferredSlot: r.preferred_slot,
    status: r.status,
    adminNote: r.admin_note,
    sessionId: r.session_id,
    createdAt: r.created_at,
  }));

  return (
    <div className="w-full px-6 lg:px-9 py-7 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/sessioni-live"
          className="text-[0.72rem] text-text-muted hover:text-accent-cyan transition-colors"
        >
          &larr; Torna alle sessioni
        </Link>
        <h1 className="font-heading text-[1.3rem] font-bold text-text-primary tracking-tight mt-2">
          Richiedi una sessione
        </h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">
          Non trovi una sessione adatta? Richiedi un mentoring personalizzato scegliendo argomento e disponibilità.
        </p>
      </div>

      {!isPro ? (
        <ProGate />
      ) : (
        <RequestSessionPage initialRequests={userRequests} />
      )}
    </div>
  );
}
