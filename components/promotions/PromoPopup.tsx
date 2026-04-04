'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Promotion, PromoTheme } from '@/types';

/* ── Theme tokens ── */
const THEMES: Record<PromoTheme, {
  header: string;
  headerPattern: string;
  badge: string;
  badgeText: string;
  title: string;
  cta: string;
  ctaText: string;
  countdown: string;
  countdownBorder: string;
  ring: string;
}> = {
  amber: {
    header:         'from-[#1C1000] via-[#261800] to-[#1C1000]',
    headerPattern:  'rgba(240,165,0,0.06)',
    badge:          'bg-accent-amber',
    badgeText:      'text-brand-dark',
    title:          'text-text-primary',
    cta:            'bg-accent-amber hover:brightness-110',
    ctaText:        'text-brand-dark',
    countdown:      'text-accent-amber',
    countdownBorder:'border-accent-amber/20 bg-accent-amber/8',
    ring:           'ring-accent-amber/20',
  },
  cyan: {
    header:         'from-[#001A19] via-[#002220] to-[#001A19]',
    headerPattern:  'rgba(78,205,196,0.06)',
    badge:          'bg-accent-cyan',
    badgeText:      'text-brand-dark',
    title:          'text-text-primary',
    cta:            'bg-accent-cyan hover:brightness-110',
    ctaText:        'text-brand-dark',
    countdown:      'text-accent-cyan',
    countdownBorder:'border-accent-cyan/20 bg-accent-cyan/8',
    ring:           'ring-accent-cyan/20',
  },
  red: {
    header:         'from-[#1A0408] via-[#22050B] to-[#1A0408]',
    headerPattern:  'rgba(232,80,91,0.06)',
    badge:          'bg-accent-rose',
    badgeText:      'text-white',
    title:          'text-text-primary',
    cta:            'bg-accent-rose hover:brightness-110',
    ctaText:        'text-white',
    countdown:      'text-accent-rose',
    countdownBorder:'border-accent-rose/20 bg-accent-rose/8',
    ring:           'ring-accent-rose/20',
  },
  green: {
    header:         'from-[#001A0A] via-[#00220D] to-[#001A0A]',
    headerPattern:  'rgba(46,204,113,0.06)',
    badge:          'bg-accent-emerald',
    badgeText:      'text-brand-dark',
    title:          'text-text-primary',
    cta:            'bg-accent-emerald hover:brightness-110',
    ctaText:        'text-brand-dark',
    countdown:      'text-accent-emerald',
    countdownBorder:'border-accent-emerald/20 bg-accent-emerald/8',
    ring:           'ring-accent-emerald/20',
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

/* ── CountdownBlock ── */
function CountdownBlock({ value, label, cls, borderCls }: {
  value: number; label: string; cls: string; borderCls: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center w-14 py-2 rounded-lg border', borderCls)}>
      <span className={cn('font-heading font-extrabold text-[1.5rem] leading-none tabular-nums', cls)}>
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[0.55rem] uppercase tracking-widest text-text-muted mt-1">{label}</span>
    </div>
  );
}

const SESSION_KEY = 'promo_popup_seen_session';

export function PromoPopup() {
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/promotions/active?type=popup');
        if (!res.ok) return;
        const { promotion } = (await res.json()) as { promotion: Promotion | null };
        if (!promotion) return;

        const localKey = `promo_dismissed_${promotion.id}`;
        const freq = promotion.popup_frequency;
        if (freq === 'once' && localStorage.getItem(localKey)) return;
        if (freq === 'per_session' && sessionStorage.getItem(SESSION_KEY) === promotion.id) return;

        setPromo(promotion);
        const delay = (promotion.popup_delay_sec ?? 3) * 1_000;
        const timer = setTimeout(() => setOpen(true), delay);
        return () => clearTimeout(timer);
      } catch {
        // Non-critical — fail silently
      }
    }
    load();
  }, []);

  function close() {
    if (!promo) return;
    if (promo.popup_frequency === 'once')
      localStorage.setItem(`promo_dismissed_${promo.id}`, '1');
    if (promo.popup_frequency === 'per_session')
      sessionStorage.setItem(SESSION_KEY, promo.id);
    setOpen(false);
  }

  const countdown = useCountdown(promo?.ends_at ?? null);
  const showCountdown = countdown !== null;

  if (!open || !promo) return null;

  const t = THEMES[promo.theme] ?? THEMES.amber;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
        style={{ animation: 'fadeIn 0.2s ease-out forwards' }}
        onClick={close}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={promo.title}
        className={cn(
          'fixed z-[91] left-1/2 top-1/2',
          'w-[92vw] max-w-[420px]',
          'bg-surface-1 rounded-xl overflow-hidden shadow-2xl ring-1',
          t.ring,
        )}
        style={{ animation: 'promo-popup-in 0.28s cubic-bezier(0.34,1.4,0.64,1) forwards' }}
      >
        {/* ── Decorative header ── */}
        <div
          className={cn('relative h-[100px] bg-gradient-to-br overflow-hidden', t.header)}
        >
          {/* Dot grid pattern */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle, ${t.headerPattern} 1px, transparent 1px)`,
              backgroundSize: '18px 18px',
            }}
          />
          {/* Large blurred orb */}
          <div
            className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl opacity-30"
            style={{ background: `var(--tw-gradient-from, #F0A500)` }}
          />
          {/* Badge — centrato nell'header */}
          {promo.badge_label && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                'font-heading text-[0.72rem] font-extrabold uppercase tracking-[0.18em] px-4 py-1.5 rounded-full shadow-lg',
                t.badge, t.badgeText,
              )}>
                {promo.badge_label}
              </span>
            </div>
          )}
          {/* Close button */}
          <button
            onClick={close}
            aria-label="Chiudi popup"
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 text-white/60 hover:text-white hover:bg-black/50 transition-colors"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <h2 className={cn('font-heading text-[1.15rem] font-bold leading-snug', t.title)}>
            {promo.title}
          </h2>

          {promo.body && (
            <p className="text-[0.82rem] text-text-secondary leading-relaxed -mt-1">
              {promo.body}
            </p>
          )}

          {/* Countdown */}
          {showCountdown && (
            <div className="flex items-center gap-2">
              {countdown!.d > 0 && (
                <CountdownBlock value={countdown!.d} label="giorni" cls={t.countdown} borderCls={t.countdownBorder} />
              )}
              <CountdownBlock value={countdown!.h} label="ore"     cls={t.countdown} borderCls={t.countdownBorder} />
              <CountdownBlock value={countdown!.m} label="minuti"  cls={t.countdown} borderCls={t.countdownBorder} />
              <CountdownBlock value={countdown!.s} label="secondi" cls={t.countdown} borderCls={t.countdownBorder} />
            </div>
          )}

          {/* CTA */}
          {promo.cta_label && promo.cta_url && (
            <Link
              href={promo.cta_url}
              onClick={close}
              className={cn(
                'flex items-center justify-center gap-2 w-full py-3 rounded-lg',
                'font-heading font-bold text-[0.9rem] transition-all active:scale-[0.98]',
                t.cta, t.ctaText,
              )}
            >
              {promo.cta_label}
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          )}

          <button
            onClick={close}
            className="text-[0.75rem] text-text-muted hover:text-text-secondary transition-colors text-center -mt-1"
          >
            No grazie, continua senza
          </button>
        </div>
      </div>
    </>
  );
}
