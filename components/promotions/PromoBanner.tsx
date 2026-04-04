'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Promotion, PromoTheme } from '@/types';

/* ── Theme tokens ── */
const THEMES: Record<PromoTheme, {
  bar: string;
  shimmer: string;
  badge: string;
  badgeText: string;
  title: string;
  dot: string;
  cta: string;
  close: string;
  countdown: string;
}> = {
  amber: {
    bar:       'bg-gradient-to-r from-[#1A1000] via-[#1F1500] to-[#1A1000] border-b border-accent-amber/30',
    shimmer:   'promo-shimmer',
    badge:     'bg-accent-amber',
    badgeText: 'text-brand-dark',
    title:     'text-accent-amber',
    dot:       'bg-accent-amber',
    cta:       'bg-accent-amber/20 text-accent-amber border-accent-amber/40 hover:bg-accent-amber/30',
    close:     'text-accent-amber/50 hover:text-accent-amber hover:bg-accent-amber/10',
    countdown: 'text-accent-amber bg-accent-amber/10 border-accent-amber/20',
  },
  cyan: {
    bar:       'bg-gradient-to-r from-[#001A19] via-[#001F1E] to-[#001A19] border-b border-accent-cyan/30',
    shimmer:   'promo-shimmer',
    badge:     'bg-accent-cyan',
    badgeText: 'text-brand-dark',
    title:     'text-accent-cyan',
    dot:       'bg-accent-cyan',
    cta:       'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/40 hover:bg-accent-cyan/30',
    close:     'text-accent-cyan/50 hover:text-accent-cyan hover:bg-accent-cyan/10',
    countdown: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20',
  },
  red: {
    bar:       'bg-gradient-to-r from-[#1A0408] via-[#1F0509] to-[#1A0408] border-b border-accent-rose/30',
    shimmer:   'promo-shimmer',
    badge:     'bg-accent-rose',
    badgeText: 'text-white',
    title:     'text-accent-rose',
    dot:       'bg-accent-rose',
    cta:       'bg-accent-rose/20 text-accent-rose border-accent-rose/40 hover:bg-accent-rose/30',
    close:     'text-accent-rose/50 hover:text-accent-rose hover:bg-accent-rose/10',
    countdown: 'text-accent-rose bg-accent-rose/10 border-accent-rose/20',
  },
  green: {
    bar:       'bg-gradient-to-r from-[#001A0D] via-[#001F10] to-[#001A0D] border-b border-accent-emerald/30',
    shimmer:   'promo-shimmer',
    badge:     'bg-accent-emerald',
    badgeText: 'text-brand-dark',
    title:     'text-accent-emerald',
    dot:       'bg-accent-emerald',
    cta:       'bg-accent-emerald/20 text-accent-emerald border-accent-emerald/40 hover:bg-accent-emerald/30',
    close:     'text-accent-emerald/50 hover:text-accent-emerald hover:bg-accent-emerald/10',
    countdown: 'text-accent-emerald bg-accent-emerald/10 border-accent-emerald/20',
  },
};

/* ── Countdown hook ── */
function useCountdown(endsAt: string | null) {
  const calc = useCallback(() => {
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    return { d, h, m, s };
  }, [endsAt]);

  const [time, setTime] = useState(calc);

  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setTime(calc()), 1_000);
    return () => clearInterval(id);
  }, [endsAt, calc]);

  return time;
}

/* ── CountdownUnit ── */
function CountdownUnit({ value, label, cls }: { value: number; label: string; cls: string }) {
  return (
    <span className={cn('inline-flex flex-col items-center justify-center px-2 py-0.5 rounded border text-center min-w-[32px]', cls)}>
      <span className="font-heading font-bold text-[0.9rem] leading-none tabular-nums">{String(value).padStart(2, '0')}</span>
      <span className="text-[0.5rem] uppercase tracking-wider opacity-60 mt-0.5">{label}</span>
    </span>
  );
}

/* ── PromoBanner ── */
export function PromoBanner() {
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/promotions/active?type=banner');
        if (!res.ok) return;
        const { promotion } = (await res.json()) as { promotion: Promotion | null };
        if (!promotion) return;
        if (localStorage.getItem(`promo_dismissed_${promotion.id}`)) return;
        setPromo(promotion);
        // Small delay so animation plays after mount
        setTimeout(() => setVisible(true), 30);
      } catch {
        // Non-critical — fail silently
      }
    }
    load();
  }, []);

  function dismiss() {
    if (!promo) return;
    localStorage.setItem(`promo_dismissed_${promo.id}`, '1');
    setVisible(false);
    setTimeout(() => setPromo(null), 300);
  }

  const countdown = useCountdown(promo?.ends_at ?? null);
  const showCountdown = countdown !== null;

  if (!promo) return null;

  const t = THEMES[promo.theme] ?? THEMES.amber;

  const content = (
    <div className="flex items-center justify-center gap-3 sm:gap-4 px-10 py-2 flex-wrap">
      {/* Pulsing dot */}
      <span className="relative items-center justify-center shrink-0 hidden sm:flex">
        <span className={cn('absolute w-3 h-3 rounded-full opacity-40 animate-[promo-pulse-dot_1.5s_ease-in-out_infinite]', t.dot)} />
        <span className={cn('relative w-2 h-2 rounded-full', t.dot)} />
      </span>

      {/* Badge */}
      {promo.badge_label && (
        <span className={cn(
          'font-heading text-[0.6rem] font-extrabold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full shrink-0',
          t.badge, t.badgeText,
        )}>
          {promo.badge_label}
        </span>
      )}

      {/* Title + body */}
      <span className={cn('font-heading font-bold text-[0.85rem] shrink-0', t.title)}>
        {promo.title}
      </span>
      {promo.body && (
        <span className="text-[0.78rem] text-text-secondary hidden md:inline shrink-0">
          {promo.body}
        </span>
      )}

      {/* Countdown */}
      {showCountdown && (
        <span className="flex items-center gap-1 shrink-0">
          {countdown!.d > 0 && <CountdownUnit value={countdown!.d} label="gg" cls={t.countdown} />}
          <CountdownUnit value={countdown!.h} label="hh" cls={t.countdown} />
          <CountdownUnit value={countdown!.m} label="mm" cls={t.countdown} />
          <CountdownUnit value={countdown!.s} label="ss" cls={t.countdown} />
        </span>
      )}

      {/* CTA */}
      {promo.cta_label && promo.cta_url && (
        <span className={cn(
          'text-[0.72rem] font-bold px-3 py-1 rounded-full border transition-colors shrink-0',
          t.cta,
        )}>
          {promo.cta_label} →
        </span>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        t.bar,
        'transition-all duration-300',
        visible ? 'opacity-100 animate-[promo-slide-down_0.35s_ease-out_forwards]' : 'opacity-0',
      )}
      role="banner"
      aria-label="Promozione attiva"
    >
      {/* Shimmer layer */}
      <div className={cn('absolute inset-0 pointer-events-none', t.shimmer)} />

      {promo.cta_url ? (
        <Link href={promo.cta_url} className="block hover:brightness-110 transition-all">
          {content}
        </Link>
      ) : (
        content
      )}

      {/* Close */}
      <button
        onClick={dismiss}
        aria-label="Chiudi banner"
        className={cn(
          'absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors z-10',
          t.close,
        )}
      >
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
