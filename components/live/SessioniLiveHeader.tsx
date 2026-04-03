'use client';

import Link from 'next/link';

interface SessioniLiveHeaderProps {
  showRequestButton?: boolean;
}

export function SessioniLiveHeader({ showRequestButton = false }: SessioniLiveHeaderProps) {
  /* Equalizer bars: altezze base diverse per effetto naturale */
  const bars = [0.45, 0.85, 0.55, 1, 0.7, 0.4, 0.9, 0.6, 0.75, 0.35];

  return (
    <>
      <style>{`
        @keyframes live-eq {
          0%, 100% { transform: scaleY(0.15); }
          50%       { transform: scaleY(1); }
        }
        @keyframes live-rec-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
        @keyframes live-glow-breathe {
          0%, 100% { opacity: 0.10; }
          50%       { opacity: 0.28; }
        }
        ${bars.map((_, i) => `.live-bar-${i} { animation: live-eq ${0.6 + (i % 4) * 0.12}s ease-in-out ${(i * 0.09).toFixed(2)}s infinite; }`).join('\n        ')}
        .live-rec   { animation: live-rec-pulse 1.1s ease-in-out infinite; }
        .live-glow  { animation: live-glow-breathe 4s ease-in-out infinite; }
      `}</style>

      <div className="relative overflow-hidden rounded-xl border border-[#4ECDC4]/20 bg-surface-1">

        {/* Linea verticale sinistra */}
        <div className="absolute left-0 inset-y-0 w-[2px] bg-gradient-to-b from-transparent via-[#4ECDC4] to-transparent opacity-65" />

        {/* Equalizer bars decorativi — sfondo destra */}
        <div className="pointer-events-none absolute right-6 inset-y-0 flex items-end gap-[3px] pb-0 opacity-[0.13]">
          {bars.map((h, i) => (
            <div
              key={i}
              className={`live-bar-${i} w-[5px] rounded-t-sm origin-bottom`}
              style={{
                height: `${Math.round(h * 56)}px`,
                background: '#4ECDC4',
                alignSelf: 'flex-end',
              }}
            />
          ))}
        </div>

        {/* Cyan glow — bottom-right (posizione nuova) */}
        <div
          className="live-glow pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full blur-3xl"
          style={{ background: '#4ECDC4' }}
        />

        {/* Amber glow — top-left, statico */}
        <div
          className="pointer-events-none absolute -top-10 -left-10 h-32 w-32 rounded-full opacity-[0.07] blur-2xl"
          style={{ background: '#F0A500' }}
        />

        <div className="relative px-6 py-5 flex items-center gap-5">

          {/* Icon — video camera + REC dot */}
          <div className="relative shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-[#4ECDC4]/10 border border-[#4ECDC4]/30">
            <svg width="22" height="22" fill="none" stroke="#4ECDC4" strokeWidth={1.7} viewBox="0 0 24 24">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14" />
              <rect x="2" y="7" width="13" height="10" rx="2" />
            </svg>
            {/* REC dot */}
            <span className="live-rec absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
          </div>

          {/* Testo */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[1.15rem] font-heading font-bold text-text-primary tracking-tight mb-1">
              Aule <span className="gradient-text-cyan">Virtuali</span>
            </h1>
            <p className="text-[0.8rem] text-text-muted leading-relaxed">
              Webinar di gruppo e mentoring 1-to-1 con il team AERABIM.
            </p>
          </div>

          {/* CTA — solo Pro */}
          {showRequestButton && (
            <Link
              href="/sessioni-live/richiedi"
              className="shrink-0 flex items-center gap-2 bg-surface-2 border border-border-subtle hover:border-[#4ECDC4]/60 text-text-secondary hover:text-accent-cyan px-4 py-2.5 rounded-sm text-[0.78rem] font-semibold transition-all"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Richiedi sessione
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
