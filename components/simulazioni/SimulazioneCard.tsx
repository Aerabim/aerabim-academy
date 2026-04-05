'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/* ── Scramble hook ──────────────────────────────────────── */

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/@\\';

function useScramble(text: string, active: boolean): string {
  const [display, setDisplay] = useState(text);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!active) {
      setDisplay(text);
      return;
    }

    const chars = text.split('');
    let step = 0;

    function tick() {
      setDisplay(
        chars
          .map((c, i) => {
            if (c === ' ') return ' ';
            if (i < step) return c;
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          })
          .join(''),
      );
      if (step < chars.length) {
        step += 0.45;
        timerRef.current = setTimeout(tick, 28);
      }
    }

    tick();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, text]);

  return display;
}

/* ── Types ──────────────────────────────────────────────── */

export interface SimulazioneItem {
  id: string;
  figura: string;
  tipo: 'scritto' | 'pratico';
  descrizione: string;
  domande?: number;
  durataMin: number;
  thumbnailUrl: string | null;
  comingSoon: boolean;
  href: string;
}

interface SimulazioneCardProps {
  item: SimulazioneItem;
  index: number;
  /** Percorso non acquistato → card locked con CTA */
  locked?: boolean;
  /** Slug del percorso associato per il link CTA */
  pathSlug?: string;
}

/* ── Accent per tipo ────────────────────────────────────── */

const ACCENT: Record<'scritto' | 'pratico', string> = {
  scritto: '#F0A500',
  pratico: '#4ECDC4',
};

/* ── Lock icon ──────────────────────────────────────────── */

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="6" width="9" height="7" rx="1.5" />
      <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" />
    </svg>
  );
}

/* ── Component ──────────────────────────────────────────── */

export function SimulazioneCard({ item, index, locked = false, pathSlug }: SimulazioneCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [visible, setVisible] = useState(false);

  const accent = ACCENT[item.tipo];
  const isBlocked = item.comingSoon || locked;
  const displayTitle = useScramble(item.figura, hovered && !isBlocked);

  /* Entrance animation */
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -16px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  const inner = (
    <div
      ref={cardRef}
      className={cn(
        'relative w-full aspect-[2/1] overflow-hidden rounded-xl',
        'border border-border-subtle transition-[opacity,transform,border-color,box-shadow] duration-500 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
        isBlocked ? 'cursor-default' : 'cursor-pointer',
      )}
      style={{
        transitionDelay: `${index * 60}ms`,
        boxShadow: hovered && !isBlocked
          ? `0 0 0 1px ${accent}40, 0 8px 32px -8px ${accent}30`
          : '0 0 0 1px transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* ── Background ── */}
      {item.thumbnailUrl ? (
        <>
          <img
            src={item.thumbnailUrl}
            alt=""
            className={cn(
              'absolute inset-0 w-full h-full object-cover transition-transform duration-700',
              hovered && !item.comingSoon && 'scale-[1.04]',
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040B11]/95 via-[#040B11]/60 to-[#040B11]/20" />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: item.tipo === 'scritto'
              ? 'linear-gradient(135deg, #040B11 0%, #1c1305 55%, #070b14 100%)'
              : 'linear-gradient(135deg, #040B11 0%, #041818 55%, #061214 100%)',
          }}
        />
      )}

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(${accent} 1px, transparent 1px),
            linear-gradient(90deg, ${accent} 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Mouse-tracking radial glow */}
      {!isBlocked && (
        <div
          className={cn(
            'absolute inset-0 pointer-events-none transition-opacity duration-300',
            hovered ? 'opacity-100' : 'opacity-0',
          )}
          style={{
            background: `radial-gradient(360px circle at ${mousePos.x}% ${mousePos.y}%, ${accent}1e, transparent 65%)`,
          }}
        />
      )}

      {/* Overlay per comingSoon o locked */}
      {isBlocked && (
        <div className="absolute inset-0 bg-[#040B11]/40 pointer-events-none" />
      )}

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 h-full transition-all duration-300 pointer-events-none"
        style={{
          width: hovered && !item.comingSoon ? '5px' : '4px',
          background: `linear-gradient(to bottom, ${accent}, ${accent}70)`,
          boxShadow: hovered && !item.comingSoon ? `2px 0 12px 0 ${accent}50` : 'none',
          opacity: item.comingSoon ? 0.4 : 1,
        }}
      />

      {/* ── Top row: badge + lock ── */}
      <div className="absolute top-3.5 left-4 right-4 z-20 flex items-start justify-between gap-2">
        {/* Badge tipo */}
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.62rem] font-bold uppercase tracking-widest border backdrop-blur-sm"
          style={{
            color: item.comingSoon ? `${accent}99` : accent,
            background: `${accent}12`,
            borderColor: `${accent}30`,
          }}
        >
          {item.tipo === 'scritto' ? (
            <>
              <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
                <rect x="0.5" y="0.5" width="8" height="8" rx="1.5" />
              </svg>
              Scritto · {item.domande} domande
            </>
          ) : (
            <>
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <polygon points="1,1 8,4.5 1,8" />
              </svg>
              Pratico · Esercitazione
            </>
          )}
        </span>

        {/* Lock icon: comingSoon o locked */}
        {isBlocked && (
          <span className="text-text-muted opacity-50">
            <LockIcon />
          </span>
        )}
      </div>

      {/* ── Content block (bottom) ── */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 pl-6">
        {/* Pill stato: coming soon o locked */}
        {item.comingSoon && (
          <span
            className="self-start mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-widest"
            style={{ color: accent, background: `${accent}14`, border: `1px solid ${accent}30` }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: accent }} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: accent }} />
            </span>
            In arrivo
          </span>
        )}
        {locked && !item.comingSoon && (
          <Link
            href={pathSlug ? `/learning-paths/${pathSlug}` : '/learning-paths'}
            className="self-start mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.65rem] font-bold transition-all duration-200 hover:brightness-110"
            style={{
              color: '#040B11',
              background: accent,
              boxShadow: `0 0 12px -2px ${accent}60`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            Acquista il percorso
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M1.5 5h7M5.5 2l3 3-3 3" />
            </svg>
          </Link>
        )}

        {/* Figura — scramble on hover */}
        <h3
          className="font-heading text-base sm:text-lg md:text-xl font-extrabold leading-tight tracking-wide transition-none mb-1"
          style={hovered && !isBlocked ? {
            backgroundImage: `linear-gradient(90deg, ${accent} 0%, ${accent}cc 60%, ${accent}88 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          } : {
            color: isBlocked ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
          }}
        >
          {displayTitle}
        </h3>

        {/* Descrizione */}
        <p className="text-[0.72rem] text-text-muted leading-snug line-clamp-2 mb-2">
          {item.descrizione}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-2 text-[0.65rem] text-text-muted">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="5" cy="5" r="4" />
            <path d="M5 2.5V5l1.5 1.5" strokeLinecap="round" />
          </svg>
          <span>{item.durataMin} min</span>
          {item.tipo === 'scritto' && item.domande && (
            <>
              <span className="opacity-30">·</span>
              <span>{item.domande} domande</span>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom accent bar ── */}
      <div className="absolute bottom-0 left-0 w-full h-[3px] pointer-events-none" style={{ background: 'rgba(23,38,54,0.5)' }}>
        <div
          className="h-full w-full transition-all duration-500"
          style={{
            background: accent,
            opacity: item.comingSoon ? 0.18 : hovered ? 0.7 : 0.25,
            boxShadow: hovered && !item.comingSoon ? `0 0 8px 1px ${accent}60` : 'none',
          }}
        />
      </div>
    </div>
  );

  if (isBlocked) {
    return inner;
  }

  return (
    <Link href={item.href} className="block">
      {inner}
    </Link>
  );
}
