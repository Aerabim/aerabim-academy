'use client';

import { useState, useMemo, useCallback } from 'react';
import { SessionCard } from './SessionCard';
import { SessionTypeFilter } from './SessionTypeFilter';
import type { LiveSessionDisplay, LiveSessionType } from '@/types';

type FilterValue = 'all' | LiveSessionType;

interface SessionListProps {
  sessions: LiveSessionDisplay[];
  isPro: boolean;
}

export function SessionList({ sessions, isPro }: SessionListProps) {
  const [filter, setFilter] = useState<FilterValue>('all');

  const handleFilterChange = useCallback((value: FilterValue) => {
    setFilter(value);
  }, []);

  const upcoming = useMemo(
    () =>
      sessions
        .filter((s) => s.status === 'scheduled' || s.status === 'live')
        .filter((s) => filter === 'all' || s.type === filter),
    [sessions, filter],
  );

  const replays = useMemo(
    () =>
      sessions
        .filter((s) => s.status === 'ended' && s.hasReplay)
        .filter((s) => filter === 'all' || s.type === filter),
    [sessions, filter],
  );

  return (
    <div>
      <div className="mb-5">
        <SessionTypeFilter onChange={handleFilterChange} />
      </div>

      {/* Upcoming sessions */}
      {upcoming.length > 0 ? (
        <div className="space-y-3">
          {upcoming.map((session) => (
            <SessionCard key={session.id} session={session} isPro={isPro} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-text-muted text-[0.88rem]">
            Nessuna sessione in programma al momento.
          </p>
          <p className="text-text-muted text-[0.78rem] mt-1">
            Nuove sessioni verranno aggiunte presto.
          </p>
        </div>
      )}

      {/* Replays */}
      {replays.length > 0 && (
        <div className="mt-8">
          <h2 className="font-heading text-[0.98rem] font-bold text-text-primary mb-3">
            Replay disponibili
          </h2>
          <div className="space-y-3">
            {replays.map((session) => (
              <SessionCard key={session.id} session={session} isPro={isPro} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
