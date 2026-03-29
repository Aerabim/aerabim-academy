'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MarkLessonCompleteProps {
  lessonId: string;
  initialCompleted: boolean;
}

export function MarkLessonComplete({ lessonId, initialCompleted }: MarkLessonCompleteProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  const handleMark = useCallback(async () => {
    if (completed || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, completed: true }),
      });

      if (res.ok) {
        setCompleted(true);
        router.refresh();
      }
    } catch {
      // Silent fail — user can retry
    } finally {
      setLoading(false);
    }
  }, [lessonId, completed, loading, router]);

  if (completed) {
    return (
      <div className="mt-4 flex items-center gap-2 text-accent-emerald">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-heading text-[0.82rem] font-semibold">Completata</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleMark}
      disabled={loading}
      className={cn(
        'mt-4 inline-flex items-center gap-2 font-heading text-[0.82rem] font-bold',
        'bg-accent-cyan text-brand-dark px-5 py-2.5 rounded-lg',
        'hover:brightness-110 transition-all',
        loading && 'opacity-60 cursor-wait',
      )}
    >
      {loading ? 'Salvataggio...' : 'Segna come completata'}
    </button>
  );
}
