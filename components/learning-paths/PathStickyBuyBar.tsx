'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { DiscountInfo } from '@/types';

interface PathStickyBuyBarProps {
  title: string;
  priceInCents: number;
  courseCount: number;
  onBuy: () => void;
  buying: boolean;
  headerRef: React.RefObject<HTMLDivElement | null>;
  discountInfo?: DiscountInfo;
}

export function PathStickyBuyBar({
  title,
  priceInCents,
  courseCount,
  onBuy,
  buying,
  headerRef,
  discountInfo,
}: PathStickyBuyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [headerRef]);

  const priceFormatted = (priceInCents / 100).toFixed(2).replace('.', ',');
  const discountedFormatted = discountInfo
    ? (discountInfo.discountedPrice / 100).toFixed(2).replace('.', ',')
    : null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out',
        visible ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      {/* Mobile: full-width bar */}
      <div className="sm:hidden px-4 pb-4 pt-3 bg-[#040B11]/95 backdrop-blur-md border-t border-white/8">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <span className="text-[0.78rem] font-semibold text-text-primary truncate">{title}</span>
          <span className="text-[0.75rem] text-text-muted shrink-0">
            {courseCount} {courseCount === 1 ? 'corso' : 'corsi'}
          </span>
        </div>
        <button
          type="button"
          onClick={onBuy}
          disabled={buying}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[0.88rem] font-bold transition-all',
            'bg-accent-amber text-brand-dark hover:brightness-110 active:scale-[0.98]',
            buying && 'opacity-70 cursor-not-allowed',
          )}
          style={{ boxShadow: '0 0 24px -6px #F0A50070' }}
        >
          {buying ? (
            <>
              <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Reindirizzamento…
            </>
          ) : (
            <>
              Acquista percorso —{' '}
              {discountInfo ? (
                <span className="flex items-center gap-1.5">
                  <span className="line-through opacity-50">€{priceFormatted}</span>
                  <span>€{discountedFormatted}</span>
                </span>
              ) : (
                <span>€{priceFormatted}</span>
              )}
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Desktop: floating pill bottom-right */}
      <div className="hidden sm:flex justify-end px-6 pb-6">
        <div
          className="flex items-center gap-4 px-5 py-3.5 rounded-2xl border border-white/10 bg-[#040B11]/90 backdrop-blur-md"
          style={{ boxShadow: '0 8px 32px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)' }}
        >
          {/* Info */}
          <div className="text-right">
            <div className="text-[0.78rem] font-semibold text-text-primary max-w-[180px] truncate">{title}</div>
            <div className="text-[0.68rem] text-text-muted mt-0.5">
              {courseCount} {courseCount === 1 ? 'corso incluso' : 'corsi inclusi'}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-white/8" />

          {/* Price + CTA */}
          <div className="flex items-center gap-3">
            {discountInfo ? (
              <div className="text-right">
                <div className="text-[0.72rem] text-text-muted line-through tabular-nums leading-none">€{priceFormatted}</div>
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'text-[0.6rem] font-bold px-1 py-0.5 rounded font-mono',
                    discountInfo.badgeColor === 'rose'
                      ? 'bg-accent-rose/20 text-accent-rose'
                      : 'bg-accent-amber/20 text-accent-amber',
                  )}>-{discountInfo.discountPct}%</span>
                  <span className="text-[1rem] font-bold text-white tabular-nums">€{discountedFormatted}</span>
                </div>
              </div>
            ) : (
              <span className="text-[1rem] font-bold text-accent-amber tabular-nums">€{priceFormatted}</span>
            )}
            <button
              type="button"
              onClick={onBuy}
              disabled={buying}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-[0.82rem] font-bold transition-all',
                'bg-accent-amber text-brand-dark hover:brightness-110 active:scale-95',
                buying && 'opacity-70 cursor-not-allowed',
              )}
              style={{ boxShadow: '0 0 20px -4px #F0A50060' }}
            >
              {buying ? (
                <>
                  <svg className="animate-spin" width="13" height="13" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Reindirizzamento…
                </>
              ) : (
                <>
                  Acquista
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
