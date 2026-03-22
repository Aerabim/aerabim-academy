import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import type { LiveSessionDisplay } from '@/types';

interface UpcomingEventsProps {
  sessions?: LiveSessionDisplay[];
}

function formatSessionDate(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  return { day, month: months[d.getMonth()] };
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export function UpcomingEvents({ sessions }: UpcomingEventsProps) {
  const displaySessions = sessions ?? [];

  return (
    <Card>
      <div className="px-5 pt-5">
        <div className="font-heading text-[0.98rem] font-bold text-text-primary tracking-tight">
          Prossimi Eventi
        </div>
        <div className="text-[0.72rem] text-text-muted mt-px">
          Sessioni live
        </div>
      </div>
      <div className="px-5 pb-5 pt-4 flex flex-col gap-2">
        {displaySessions.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-[0.78rem] text-text-muted">Nessuna sessione in programma.</p>
            <Link
              href="/sessioni-live"
              className="text-[0.72rem] text-accent-cyan hover:underline mt-1 inline-block"
            >
              Vedi tutte le sessioni
            </Link>
          </div>
        ) : (
          <>
            {displaySessions.map((session) => {
              const { day, month } = formatSessionDate(session.scheduledAt);
              const time = formatTime(session.scheduledAt);
              const isLive = session.status === 'live';
              const typeLabel = session.type === 'webinar' ? 'Webinar' : 'Mentoring';

              return (
                <Link
                  key={session.id}
                  href={`/sessioni-live/${session.id}`}
                  className="flex items-center gap-3 p-3 bg-surface-2 rounded-sm border border-transparent hover:bg-surface-3 hover:border-border-subtle transition-all"
                >
                  <div className="w-[46px] h-[46px] rounded-sm bg-accent-cyan-dim flex flex-col items-center justify-center shrink-0">
                    <span className="font-heading text-[1.05rem] font-extrabold text-accent-cyan leading-none">
                      {day}
                    </span>
                    <span className="font-heading text-[0.55rem] uppercase text-text-muted font-bold">
                      {month}
                    </span>
                  </div>
                  <div>
                    <div className="text-[0.8rem] font-semibold text-text-primary flex items-center gap-2">
                      {isLive && (
                        <span className="inline-flex items-center gap-1 font-heading text-[0.58rem] font-extrabold text-accent-rose uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-rose animate-pulse" />
                          LIVE
                        </span>
                      )}
                      {session.title}
                    </div>
                    <div className="text-[0.7rem] text-text-muted mt-0.5">
                      {typeLabel} con {session.hostName} · {time}
                    </div>
                  </div>
                </Link>
              );
            })}
            <Link
              href="/sessioni-live"
              className="text-[0.72rem] text-accent-cyan hover:underline text-center mt-1"
            >
              Vedi tutte
            </Link>
          </>
        )}
      </div>
    </Card>
  );
}
