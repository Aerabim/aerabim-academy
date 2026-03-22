import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { getLiveSessionDetail, hasActiveProSubscription } from '@/lib/live/queries';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BookingButton } from '@/components/live/BookingButton';

interface PageProps {
  params: { sessionId: string };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function SessionDetailPage({ params }: PageProps) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [isPro, detail] = await Promise.all([
    hasActiveProSubscription(supabase, user.id),
    getLiveSessionDetail(supabase, params.sessionId, user.id),
  ]);

  if (!detail || !detail.session) {
    notFound();
  }

  const { session, isBooked, bookedCount } = detail;
  const isWebinar = session.type === 'webinar';
  const isLive = session.status === 'live';
  const isEnded = session.status === 'ended';
  const spotsLeft = session.max_participants
    ? session.max_participants - bookedCount
    : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const hasReplay = session.mux_replay_playback_id !== null;

  return (
    <div className="w-full px-6 lg:px-9 py-7 max-w-3xl">
      {/* Back link */}
      <Link
        href="/sessioni-live"
        className="inline-flex items-center gap-1.5 text-[0.78rem] text-text-muted hover:text-text-secondary transition-colors mb-5"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Torna alle sessioni
      </Link>

      <Card topBorder={isWebinar ? 'cyan' : 'amber'}>
        <div className="p-6">
          {/* Header badges */}
          <div className="flex items-center gap-2 mb-3">
            {isLive && (
              <span className="inline-flex items-center gap-1 font-heading text-[0.62rem] font-extrabold text-accent-rose uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-accent-rose animate-pulse" />
                LIVE ORA
              </span>
            )}
            <Badge variant={isWebinar ? 'cyan' : 'amber'}>
              {isWebinar ? 'Webinar' : 'Mentoring 1-to-1'}
            </Badge>
            {isEnded && <Badge variant="rose">Conclusa</Badge>}
            {isBooked && !isEnded && <Badge variant="emerald">Prenotato</Badge>}
          </div>

          {/* Title */}
          <h1 className="font-heading text-xl font-bold text-text-primary mb-2">
            {session.title}
          </h1>

          {/* Description */}
          {session.description && (
            <p className="text-[0.84rem] text-text-secondary leading-relaxed mb-5">
              {session.description}
            </p>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface-2 rounded-lg p-3">
              <div className="text-[0.68rem] text-text-muted uppercase tracking-wider mb-0.5">Data</div>
              <div className="text-[0.82rem] text-text-primary font-semibold">
                {formatDate(session.scheduled_at)}
              </div>
            </div>
            <div className="bg-surface-2 rounded-lg p-3">
              <div className="text-[0.68rem] text-text-muted uppercase tracking-wider mb-0.5">Ora</div>
              <div className="text-[0.82rem] text-text-primary font-semibold">
                {formatTime(session.scheduled_at)}
              </div>
            </div>
            <div className="bg-surface-2 rounded-lg p-3">
              <div className="text-[0.68rem] text-text-muted uppercase tracking-wider mb-0.5">Durata</div>
              <div className="text-[0.82rem] text-text-primary font-semibold">
                {session.duration_min} minuti
              </div>
            </div>
            <div className="bg-surface-2 rounded-lg p-3">
              <div className="text-[0.68rem] text-text-muted uppercase tracking-wider mb-0.5">Host</div>
              <div className="text-[0.82rem] text-text-primary font-semibold">
                {session.host_name}
              </div>
            </div>
          </div>

          {/* Spots info */}
          {session.max_participants && !isEnded && (
            <div className="text-[0.78rem] text-text-secondary mb-4">
              {isFull
                ? 'Tutti i posti sono stati prenotati.'
                : `${spotsLeft} ${spotsLeft === 1 ? 'posto disponibile' : 'posti disponibili'} su ${session.max_participants}`}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-border-subtle">
            {/* Book / Cancel */}
            <BookingButton
              sessionId={session.id}
              isBooked={isBooked}
              isFull={isFull}
              isEnded={isEnded}
              isPro={isPro}
            />

            {/* Join button (if live and booked) */}
            {isLive && isBooked && isPro && (
              <Link
                href={`/sessioni-live/${session.id}/live`}
                className="inline-flex items-center gap-2 px-5 py-2 bg-accent-rose text-white font-semibold text-[0.82rem] rounded-lg hover:bg-accent-rose/90 transition-colors animate-pulse"
              >
                <span className="w-2 h-2 rounded-full bg-white" />
                Partecipa ora
              </Link>
            )}

            {/* Replay button */}
            {isEnded && hasReplay && isPro && (
              <Link
                href={`/sessioni-live/${session.id}/live`}
                className="inline-flex items-center gap-2 px-5 py-2 bg-accent-violet text-white font-semibold text-[0.82rem] rounded-lg hover:bg-accent-violet/90 transition-colors"
              >
                Guarda il replay
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
