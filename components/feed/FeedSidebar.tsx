'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function OnlineCounter() {
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
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-emerald" />
      </span>
      <span className="text-[0.72rem] text-text-muted">
        <span className="font-semibold text-text-secondary">{count}</span>{' '}
        {count === 1 ? 'online' : 'online'}
      </span>
    </div>
  );
}
