import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasActiveProSubscription } from '@/lib/live/queries';
import { Card } from '@/components/ui/Card';
import { LivePlayer } from '@/components/live/LivePlayer';

interface PageProps {
  params: { sessionId: string };
}

export default async function LiveViewerPage({ params }: PageProps) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify Pro subscription
  const isPro = await hasActiveProSubscription(supabase, user.id);
  if (!isPro) {
    redirect('/sessioni-live');
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    notFound();
  }

  // Verify session exists and user has booking
  const [sessionResult, bookingResult] = await Promise.all([
    admin
      .from('live_sessions')
      .select('id, type, title, host_name, status, mux_playback_id, meeting_url, mux_replay_playback_id')
      .eq('id', params.sessionId)
      .eq('is_published', true)
      .single(),
    admin
      .from('live_session_bookings')
      .select('id')
      .eq('session_id', params.sessionId)
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .single(),
  ]);

  const session = sessionResult.data;
  const booking = bookingResult.data;

  if (!session) {
    notFound();
  }

  // For ended webinars with replay, allow access even without booking
  const isReplay = session.status === 'ended' && session.mux_replay_playback_id;

  if (!booking && !isReplay) {
    redirect(`/sessioni-live/${params.sessionId}`);
  }

  // Session must be live or ended with replay
  if (session.status === 'scheduled' || session.status === 'canceled') {
    redirect(`/sessioni-live/${params.sessionId}`);
  }

  return (
    <div className="w-full px-6 lg:px-9 py-7 max-w-4xl">
      {/* Back link */}
      <Link
        href={`/sessioni-live/${params.sessionId}`}
        className="inline-flex items-center gap-1.5 text-[0.78rem] text-text-muted hover:text-text-secondary transition-colors mb-5"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Torna alla sessione
      </Link>

      <Card>
        <div className="p-5">
          <LivePlayer
            sessionId={session.id}
            sessionTitle={session.title}
            hostName={session.host_name}
          />
        </div>
      </Card>
    </div>
  );
}
