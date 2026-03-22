'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminToolbarProps {
  discussionId: string;
  isPinned: boolean;
  isLocked: boolean;
  categorySlug: string;
}

export function AdminToolbar({ discussionId, isPinned, isLocked, categorySlug }: AdminToolbarProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  const handleAction = async (action: 'pin' | 'lock' | 'delete') => {
    setPending(action);

    try {
      const body: Record<string, unknown> = {};

      switch (action) {
        case 'pin':
          body.is_pinned = !isPinned;
          break;
        case 'lock':
          body.is_locked = !isLocked;
          break;
        case 'delete':
          if (!confirm('Sei sicuro di voler eliminare questa discussione?')) {
            setPending(null);
            return;
          }
          body.is_deleted = true;
          break;
      }

      const res = await fetch(`/api/community/discussions/${discussionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        if (action === 'delete') {
          router.push(`/community/${categorySlug}`);
        } else {
          router.refresh();
        }
      }
    } catch {
      // Silent fail
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-surface-2 border border-border-subtle rounded-lg px-3 py-2">
      <span className="text-[0.68rem] font-bold text-text-muted uppercase tracking-wider mr-2">
        Admin
      </span>

      <button
        onClick={() => handleAction('pin')}
        disabled={pending !== null}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[0.72rem] font-medium transition-colors ${
          isPinned
            ? 'bg-accent-amber/10 text-accent-amber'
            : 'text-text-muted hover:text-accent-amber hover:bg-accent-amber/5'
        }`}
      >
        <svg width="12" height="12" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
        </svg>
        {pending === 'pin' ? '...' : isPinned ? 'Rimuovi evidenza' : 'In evidenza'}
      </button>

      <button
        onClick={() => handleAction('lock')}
        disabled={pending !== null}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[0.72rem] font-medium transition-colors ${
          isLocked
            ? 'bg-text-muted/10 text-text-secondary'
            : 'text-text-muted hover:text-text-secondary hover:bg-surface-3'
        }`}
      >
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        {pending === 'lock' ? '...' : isLocked ? 'Riapri' : 'Chiudi'}
      </button>

      <button
        onClick={() => handleAction('delete')}
        disabled={pending !== null}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[0.72rem] font-medium text-text-muted hover:text-accent-rose hover:bg-accent-rose/5 transition-colors"
      >
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
        {pending === 'delete' ? '...' : 'Elimina'}
      </button>
    </div>
  );
}
