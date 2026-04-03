'use client';

import { useState } from 'react';
import { timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { AdminFeedEvent, FeedItemType } from '@/types';

interface FeedModerationTableProps {
  initial: AdminFeedEvent[];
}

const TYPE_LABELS: Record<FeedItemType, string> = {
  progress:    'Progresso',
  certificate: 'Certificato',
  enrollment:  'Iscrizione',
  discussion:  'Discussione',
  admin_post:  'Post admin',
};

const TYPE_COLORS: Record<FeedItemType, string> = {
  progress:    'text-accent-cyan bg-accent-cyan/10',
  certificate: 'text-accent-amber bg-accent-amber/10',
  enrollment:  'text-accent-emerald bg-accent-emerald/10',
  discussion:  'text-accent-violet bg-accent-violet/10',
  admin_post:  'text-text-muted bg-surface-3',
};

export function FeedModerationTable({ initial }: FeedModerationTableProps) {
  const [events, setEvents] = useState<AdminFeedEvent[]>(initial);
  const [acting, setActing] = useState<string | null>(null);

  async function handleHide(event: AdminFeedEvent) {
    setActing(event.id);
    try {
      const res = await fetch('/api/admin/feed/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: event.type, itemId: event.itemId }),
      });
      if (res.ok) {
        setEvents((prev) => prev.map((e) => e.id === event.id ? { ...e, isHidden: true } : e));
      }
    } finally {
      setActing(null);
    }
  }

  async function handleRestore(event: AdminFeedEvent) {
    setActing(event.id);
    try {
      const res = await fetch('/api/admin/feed/hide', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: event.type, itemId: event.itemId }),
      });
      if (res.ok) {
        setEvents((prev) => prev.map((e) => e.id === event.id ? { ...e, isHidden: false } : e));
      }
    } finally {
      setActing(null);
    }
  }

  if (events.length === 0) {
    return (
      <p className="text-center py-10 text-[0.82rem] text-text-muted">
        Nessuna attività recente nel feed.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border-subtle">
      {events.map((event) => (
        <div key={event.id} className={cn(
          'flex items-center gap-4 py-3.5',
          event.isHidden && 'opacity-40',
        )}>
          {/* Tipo */}
          <span className={cn(
            'shrink-0 text-[0.62rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded',
            TYPE_COLORS[event.type],
          )}>
            {TYPE_LABELS[event.type]}
          </span>

          {/* Label */}
          <span className="flex-1 min-w-0 text-[0.8rem] text-text-secondary truncate">
            {event.label}
          </span>

          {/* Timestamp */}
          <span className="shrink-0 text-[0.7rem] text-text-muted">
            {timeAgo(event.createdAt)}
          </span>

          {/* Azione */}
          {event.type !== 'admin_post' && (
            event.isHidden ? (
              <button
                onClick={() => handleRestore(event)}
                disabled={acting === event.id}
                className="shrink-0 text-[0.72rem] font-medium text-accent-cyan hover:underline disabled:opacity-40"
              >
                Ripristina
              </button>
            ) : (
              <button
                onClick={() => handleHide(event)}
                disabled={acting === event.id}
                className="shrink-0 text-[0.72rem] font-medium text-accent-rose hover:underline disabled:opacity-40"
              >
                Nascondi
              </button>
            )
          )}
        </div>
      ))}
    </div>
  );
}
