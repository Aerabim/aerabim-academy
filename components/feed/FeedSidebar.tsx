'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createBrowserClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/Badge';

interface FeedSession {
  id: string;
  type: string;
  title: string;
  hostName: string;
  scheduledAt: string;
  durationMin: number;
  status: string;
  bookedCount: number;
  maxParticipants: number | null;
  isBooked: boolean;
}

interface FeedSidebarProps {
  sessions: FeedSession[];
  showOnline: boolean;
}

/* ── Countdown ── */
function useCountdown(targetIso: string) {
  const [diff, setDiff] = useState(() => new Date(targetIso).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setDiff(new Date(targetIso).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (diff <= 0) return { label: 'In corso', urgent: true };

  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (days > 0) return { label: `${days}g ${hours}h`, urgent: false };
  if (hours > 0) return { label: `${hours}h ${mins}m`, urgent: false };
  if (mins >= 5) return { label: `${mins}m`, urgent: false };

  const pad = (n: number) => String(n).padStart(2, '0');
  return { label: `${pad(mins)}:${pad(secs)}`, urgent: true };
}

function SessionCountdown({ scheduledAt, status }: { scheduledAt: string; status: string }) {
  const { label, urgent } = useCountdown(scheduledAt);
  const isLive = status === 'live';

  return (
    <span className={cn(
      'text-[0.72rem] font-mono font-bold tabular-nums',
      isLive ? 'text-accent-rose animate-pulse' : urgent ? 'text-accent-amber' : 'text-accent-cyan',
    )}>
      {isLive ? '🔴 LIVE' : label}
    </span>
  );
}

function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
    + ' · ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

/* ── Online presence counter ── */
function OnlineCounter() {
  const [count, setCount] = useState<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase.channel('feed-presence', {
      config: { presence: { key: 'user' } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ userId: string }>();
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;
    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, []);

  if (count === null) return null;

  return (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-emerald" />
      </span>
      <span className="text-[0.74rem] text-text-secondary">
        <span className="font-semibold text-text-primary">{count}</span>{' '}
        {count === 1 ? 'utente online' : 'utenti online'}
      </span>
    </div>
  );
}

/* ── Main sidebar ── */
export function FeedSidebar({ sessions, showOnline }: FeedSidebarProps) {
  return (
    <aside className="flex flex-col gap-5">
      {/* Sessioni imminenti */}
      <div className="bg-surface-1 border border-border-subtle rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle flex items-center gap-2">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-accent-amber shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h2 className="text-[0.84rem] font-heading font-semibold text-text-primary">Prossime sessioni</h2>
        </div>

        {showOnline && <OnlineCounter />}

        {sessions.length === 0 ? (
          <div className="px-5 py-8 text-center text-[0.8rem] text-text-muted">
            Nessuna sessione in programma.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href="/sessioni-live"
                className="flex flex-col gap-2 px-5 py-3.5 hover:bg-surface-2/40 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.8rem] font-medium text-text-primary line-clamp-2 leading-snug">{s.title}</div>
                    <div className="text-[0.7rem] text-text-muted mt-0.5">{s.hostName}</div>
                  </div>
                  <Badge variant={s.type === 'webinar' ? 'cyan' : 'amber'}>
                    {s.type === 'webinar' ? 'Webinar' : 'Mentoring'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[0.7rem] text-text-muted">{formatSessionDate(s.scheduledAt)}</span>
                  <SessionCountdown scheduledAt={s.scheduledAt} status={s.status} />
                </div>

                <div className="flex items-center gap-3">
                  {s.isBooked && (
                    <span className="text-[0.68rem] text-accent-emerald font-semibold">✓ Prenotato</span>
                  )}
                  {s.maxParticipants && (
                    <span className={cn(
                      'text-[0.68rem] font-medium',
                      s.bookedCount >= s.maxParticipants ? 'text-accent-rose' : 'text-text-muted',
                    )}>
                      {s.bookedCount}/{s.maxParticipants} posti
                    </span>
                  )}
                  <span className="text-[0.68rem] text-text-muted ml-auto">{s.durationMin} min</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="px-5 py-3 border-t border-border-subtle">
          <Link href="/sessioni-live" className="text-[0.76rem] text-accent-cyan hover:underline font-medium">
            Vedi tutte le sessioni →
          </Link>
        </div>
      </div>

    </aside>
  );
}
