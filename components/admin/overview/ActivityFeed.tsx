import Link from 'next/link';
import { timeAgo } from '@/lib/utils';
import type { AdminActivityEvent } from '@/types';

interface ActivityFeedProps {
  events: AdminActivityEvent[];
}

const ACCESS_TYPE_LABELS: Record<string, string> = {
  pro_subscription: 'Abbonamento Pro',
  single:           'Acquisto singolo',
  free:             'Gratuito',
  team:             'Team',
};

function EventIcon({ type }: { type: AdminActivityEvent['type'] }) {
  if (type === 'enrollment') {
    return (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-accent-emerald">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <polyline points="16 11 18 13 22 9" />
      </svg>
    );
  }
  if (type === 'new_user') {
    return (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-accent-cyan">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="16" y1="11" x2="22" y2="11" />
      </svg>
    );
  }
  // session_request
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-accent-amber">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function eventIconBg(type: AdminActivityEvent['type']) {
  if (type === 'enrollment')      return 'bg-accent-emerald/10';
  if (type === 'new_user')        return 'bg-accent-cyan/10';
  return 'bg-accent-amber/10';
}

function eventLabel(event: AdminActivityEvent): { primary: string; secondary?: string } {
  if (event.type === 'new_user') {
    return {
      primary:   `${event.userName} si è registrato`,
      secondary: event.userEmail || undefined,
    };
  }
  if (event.type === 'enrollment') {
    return {
      primary:   `${event.userName} si è iscritto`,
      secondary: event.courseTitle,
    };
  }
  return {
    primary:   `${event.userName} ha richiesto una sessione`,
    secondary: event.userEmail || undefined,
  };
}

function accessTypePill(accessType?: string) {
  if (!accessType) return null;
  const label = ACCESS_TYPE_LABELS[accessType] ?? accessType;
  const colorClass =
    accessType === 'pro_subscription' ? 'bg-accent-cyan/10 text-accent-cyan' :
    accessType === 'free'             ? 'bg-accent-emerald/10 text-accent-emerald' :
    accessType === 'team'             ? 'bg-accent-violet/10 text-accent-violet' :
                                        'bg-accent-amber/10 text-accent-amber';
  return (
    <span className={`text-[0.6rem] font-semibold px-1.5 py-[2px] rounded-full leading-none ${colorClass}`}>
      {label}
    </span>
  );
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="bg-surface-1 border border-border-subtle rounded-lg p-6 text-center text-[0.82rem] text-text-muted">
        Nessuna attività recente.
      </div>
    );
  }

  return (
    <div className="bg-surface-1 border border-border-subtle rounded-lg overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between">
        <h2 className="text-[0.82rem] font-heading font-semibold text-text-primary">
          Attività recente
        </h2>
        <div className="flex items-center gap-3 text-[0.68rem] text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent-emerald/60" /> Iscrizioni
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent-cyan/60" /> Nuovi utenti
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent-amber/60" /> Richieste
          </span>
        </div>
      </div>

      <ul className="divide-y divide-border-subtle">
        {events.map((event) => {
          const { primary, secondary } = eventLabel(event);
          return (
            <li key={event.id} className="flex items-start gap-3.5 px-5 py-3 hover:bg-surface-2/40 transition-colors">
              <span className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${eventIconBg(event.type)}`}>
                <EventIcon type={event.type} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[0.8rem] text-text-primary font-medium">{primary}</span>
                  {event.type === 'enrollment' && accessTypePill(event.accessType)}
                </div>
                {secondary && (
                  <div className="text-[0.72rem] text-text-muted mt-0.5 truncate">{secondary}</div>
                )}
              </div>
              <span className="shrink-0 text-[0.7rem] text-text-muted mt-0.5 whitespace-nowrap">
                {timeAgo(event.date)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="px-5 py-2.5 border-t border-border-subtle">
        <Link
          href="/admin/iscrizioni"
          className="text-[0.75rem] text-text-muted hover:text-accent-cyan transition-colors"
        >
          Vedi tutte le iscrizioni →
        </Link>
      </div>
    </div>
  );
}
