'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';

interface DiscussionItem {
  id: string;
  title: string;
  authorName: string;
  categoryName: string;
  replyCount: number;
  likeCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isDeleted: boolean;
  createdAt: string;
}

interface Props {
  discussions: DiscussionItem[];
}

export function CommunityModerationTable({ discussions: initial }: Props) {
  const [discussions, setDiscussions] = useState(initial);
  const [filter, setFilter] = useState<'all' | 'pinned' | 'locked' | 'deleted'>('all');

  const filtered = discussions.filter((d) => {
    if (filter === 'pinned') return d.isPinned;
    if (filter === 'locked') return d.isLocked;
    if (filter === 'deleted') return d.isDeleted;
    return true;
  });

  async function handleAction(id: string, action: 'pin' | 'unpin' | 'lock' | 'unlock' | 'delete' | 'restore') {
    const updates: Record<string, boolean> = {};
    if (action === 'pin') updates.is_pinned = true;
    if (action === 'unpin') updates.is_pinned = false;
    if (action === 'lock') updates.is_locked = true;
    if (action === 'unlock') updates.is_locked = false;
    if (action === 'delete') updates.is_deleted = true;
    if (action === 'restore') updates.is_deleted = false;

    try {
      const res = await fetch(`/api/community/discussions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        setDiscussions((prev) =>
          prev.map((d) => d.id === id ? { ...d, ...mapUpdates(updates) } : d),
        );
      }
    } catch (err) {
      console.error('Moderation action error:', err);
    }
  }

  function mapUpdates(updates: Record<string, boolean>) {
    const mapped: Partial<DiscussionItem> = {};
    if (updates.is_pinned !== undefined) mapped.isPinned = updates.is_pinned;
    if (updates.is_locked !== undefined) mapped.isLocked = updates.is_locked;
    if (updates.is_deleted !== undefined) mapped.isDeleted = updates.is_deleted;
    return mapped;
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'pinned', 'locked', 'deleted'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 text-[0.78rem] font-medium rounded-md transition-colors',
              filter === f
                ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20'
                : 'text-text-muted hover:text-text-primary bg-surface-2 border border-border-subtle',
            )}
          >
            {f === 'all' ? 'Tutte' : f === 'pinned' ? 'Fissate' : f === 'locked' ? 'Bloccate' : 'Eliminate'}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-border-subtle rounded-lg">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-2/50">
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Discussione</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Categoria</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Risposte</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Like</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Stato</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[0.82rem] text-text-muted">Nessuna discussione.</td></tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id} className={cn(
                  'border-b border-border-subtle last:border-b-0 hover:bg-surface-2/30 transition-colors',
                  d.isDeleted && 'opacity-50',
                )}>
                  <td className="px-4 py-3">
                    <div className="text-[0.82rem] font-medium text-text-primary">{d.title}</div>
                    <div className="text-[0.7rem] text-text-muted">{d.authorName} &middot; {timeAgo(d.createdAt)}</div>
                  </td>
                  <td className="px-4 py-3 text-[0.82rem] text-text-secondary">{d.categoryName}</td>
                  <td className="px-4 py-3 text-[0.82rem] text-text-secondary">{d.replyCount}</td>
                  <td className="px-4 py-3 text-[0.82rem] text-text-secondary">{d.likeCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {d.isPinned && <Badge variant="cyan">Fissata</Badge>}
                      {d.isLocked && <Badge variant="amber">Bloccata</Badge>}
                      {d.isDeleted && <Badge variant="rose">Eliminata</Badge>}
                      {!d.isPinned && !d.isLocked && !d.isDeleted && <span className="text-[0.72rem] text-text-muted">Attiva</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleAction(d.id, d.isPinned ? 'unpin' : 'pin')}
                        className="text-[0.72rem] text-accent-cyan hover:underline"
                      >
                        {d.isPinned ? 'Sblocca pin' : 'Fissa'}
                      </button>
                      <button
                        onClick={() => handleAction(d.id, d.isLocked ? 'unlock' : 'lock')}
                        className="text-[0.72rem] text-accent-amber hover:underline"
                      >
                        {d.isLocked ? 'Sblocca' : 'Blocca'}
                      </button>
                      <button
                        onClick={() => handleAction(d.id, d.isDeleted ? 'restore' : 'delete')}
                        className="text-[0.72rem] text-accent-rose hover:underline"
                      >
                        {d.isDeleted ? 'Ripristina' : 'Elimina'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
