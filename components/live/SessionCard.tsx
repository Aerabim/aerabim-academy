import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { LiveSessionDisplay } from '@/types';

interface SessionCardProps {
  session: LiveSessionDisplay;
  isPro: boolean;
}

function formatSessionDate(isoDate: string): { day: string; month: string; time: string; weekday: string } {
  const d = new Date(isoDate);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  const weekdays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const month = months[d.getMonth()];
  const weekday = weekdays[d.getDay()];
  const time = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  return { day, month, time, weekday };
}

export function SessionCard({ session, isPro }: SessionCardProps) {
  const { day, month, time, weekday } = formatSessionDate(session.scheduledAt);
  const isWebinar = session.type === 'webinar';
  const isLive = session.status === 'live';
  const isEnded = session.status === 'ended';
  const spotsLeft = session.maxParticipants
    ? session.maxParticipants - session.bookedCount
    : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  return (
    <Card topBorder={isWebinar ? 'cyan' : 'amber'}>
      <Link
        href={`/sessioni-live/${session.id}`}
        className="block p-5 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-start gap-4">
          {/* Date badge */}
          <div className="w-[52px] h-[52px] rounded-lg bg-surface-3 flex flex-col items-center justify-center shrink-0">
            <span className={`font-heading text-[1.1rem] font-extrabold leading-none ${isWebinar ? 'text-accent-cyan' : 'text-accent-amber'}`}>
              {day}
            </span>
            <span className="font-heading text-[0.55rem] uppercase text-text-muted font-bold">
              {month}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isLive && (
                <span className="inline-flex items-center gap-1 font-heading text-[0.58rem] font-extrabold text-accent-rose uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-rose animate-pulse" />
                  LIVE
                </span>
              )}
              <Badge variant={isWebinar ? 'cyan' : 'amber'}>
                {isWebinar ? 'Webinar' : 'Mentoring'}
              </Badge>
              {session.isBooked && (
                <Badge variant="emerald">Prenotato</Badge>
              )}
            </div>

            <h3 className="text-[0.88rem] font-semibold text-text-primary truncate">
              {session.title}
            </h3>

            <div className="flex items-center gap-3 mt-1.5 text-[0.72rem] text-text-muted">
              <span>{weekday} {time}</span>
              <span>{session.durationMin} min</span>
              <span>con {session.hostName}</span>
            </div>

            {/* Spots info for mentoring */}
            {session.maxParticipants && !isEnded && (
              <div className="mt-1.5 text-[0.68rem]">
                {isFull ? (
                  <span className="text-accent-rose font-semibold">Posti esauriti</span>
                ) : (
                  <span className="text-text-muted">
                    {spotsLeft}/{session.maxParticipants} {spotsLeft === 1 ? 'posto disponibile' : 'posti disponibili'}
                  </span>
                )}
              </div>
            )}

            {/* Replay badge for ended sessions */}
            {isEnded && session.hasReplay && (
              <div className="mt-1.5">
                <Badge variant="violet">Replay disponibile</Badge>
              </div>
            )}
          </div>

          {/* CTA arrow */}
          {isPro && (
            <div className="shrink-0 text-text-muted">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          )}
        </div>
      </Link>
    </Card>
  );
}
