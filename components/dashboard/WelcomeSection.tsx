'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const HeroScene = dynamic(
  () => import('./HeroScene').then((m) => ({ default: m.HeroScene })),
  { ssr: false },
);

interface WelcomeSectionProps {
  firstName: string;
}

export function WelcomeSection({ firstName }: WelcomeSectionProps) {
  return (
    <div className="relative overflow-hidden bg-surface-1 border border-border-subtle rounded-lg">
      {/* 3D scene — positioned absolutely behind content */}
      <div className="absolute inset-0 opacity-60 pointer-events-none lg:pointer-events-auto">
        <HeroScene />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-6 py-6 lg:px-8 lg:py-7">
        <div>
          <h2 className="font-heading text-[1.85rem] font-bold tracking-tight leading-tight">
            Bentornato, <em className="not-italic gradient-text-cyan">{firstName}</em>
          </h2>
          <p className="text-text-secondary text-[0.88rem] mt-1">
            Hai completato 3 lezioni questa settimana. Continua cos&igrave;!
          </p>
        </div>
        <div className="flex gap-2.5 shrink-0">
          <Link
            href="/i-miei-corsi"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-accent-cyan text-brand-dark font-heading text-[0.82rem] font-semibold hover:bg-[#5FE0D7] hover:shadow-[0_4px_20px_rgba(78,205,196,0.25)] hover:-translate-y-px transition-all"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Riprendi Corso
          </Link>
          <Link
            href="/catalogo-corsi"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-transparent text-text-secondary border border-border-hover font-heading text-[0.82rem] font-semibold hover:border-[rgba(157,177,191,0.25)] hover:text-text-primary transition-all"
          >
            Esplora Catalogo
          </Link>
        </div>
      </div>
    </div>
  );
}
