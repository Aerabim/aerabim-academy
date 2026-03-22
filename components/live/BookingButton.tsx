'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface BookingButtonProps {
  sessionId: string;
  isBooked: boolean;
  isFull: boolean;
  isEnded: boolean;
  isPro: boolean;
}

export function BookingButton({ sessionId, isBooked: initialBooked, isFull, isEnded, isPro }: BookingButtonProps) {
  const [isBooked, setIsBooked] = useState(initialBooked);
  const [loading, setLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    if (!isPro || isEnded) return;

    setLoading(true);
    try {
      if (isBooked) {
        const res = await fetch(`/api/live-sessions/${sessionId}/book`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setIsBooked(false);
        }
      } else {
        const res = await fetch(`/api/live-sessions/${sessionId}/book`, {
          method: 'POST',
        });
        if (res.ok) {
          setIsBooked(true);
        }
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }, [sessionId, isBooked, isPro, isEnded]);

  if (isEnded) {
    return null;
  }

  if (!isPro) {
    return (
      <span className="text-[0.78rem] text-text-muted italic">
        Solo per abbonati Pro
      </span>
    );
  }

  if (isFull && !isBooked) {
    return (
      <span className="text-[0.78rem] text-accent-rose font-semibold">
        Posti esauriti
      </span>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'px-4 py-2 rounded-lg text-[0.82rem] font-semibold transition-all disabled:opacity-50',
        isBooked
          ? 'border border-border-subtle text-text-secondary hover:bg-surface-3 hover:text-accent-rose'
          : 'bg-accent-cyan text-brand-dark hover:bg-accent-cyan/90',
      )}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Attendere...
        </span>
      ) : isBooked ? (
        'Annulla prenotazione'
      ) : (
        'Prenota'
      )}
    </button>
  );
}
