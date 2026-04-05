'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type ItemType = 'article' | 'resource' | 'path' | 'session';

interface BookmarkButtonProps {
  itemType: ItemType;
  itemId: string;
  initialFavorited?: boolean;
  className?: string;
}

export function BookmarkButton({ itemType, itemId, initialFavorited = false, className }: BookmarkButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    const prev = favorited;
    setFavorited(!prev);

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType, itemId }),
      });
      if (!res.ok) setFavorited(prev);
    } catch {
      setFavorited(prev);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={favorited ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
      className={cn(
        'p-1.5 rounded-full transition-all duration-200',
        'bg-surface-0/70 backdrop-blur-sm hover:bg-surface-0/90',
        loading && 'opacity-50 cursor-wait',
        className,
      )}
    >
      <svg
        width="16"
        height="16"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
        className={cn(
          'transition-colors duration-200',
          favorited ? 'text-accent-cyan' : 'text-text-primary',
        )}
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
    </button>
  );
}
