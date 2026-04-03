'use client';

import Link from 'next/link';

interface CommunityLiveHeaderProps {
  showNewButton?: boolean;
}

export function CommunityLiveHeader({ showNewButton = false }: CommunityLiveHeaderProps) {
  return (
    <>
      <style>{`
        @keyframes comm-orbit-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes comm-node-flash {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 0.95; }
        }
        @keyframes comm-sweep-y {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(500%); }
        }
        @keyframes comm-amber-breathe {
          0%, 100% { opacity: 0.09; }
          50%       { opacity: 0.22; }
        }
        .comm-orbit  { animation: comm-orbit-spin 12s linear infinite; }
        .comm-node-1 { animation: comm-node-flash 2.6s ease-in-out 0s infinite; }
        .comm-node-2 { animation: comm-node-flash 2.6s ease-in-out 0.87s infinite; }
        .comm-node-3 { animation: comm-node-flash 2.6s ease-in-out 1.73s infinite; }
        .comm-sweep  { animation: comm-sweep-y 5s ease-in-out 0.8s infinite; }
        .comm-glow   { animation: comm-amber-breathe 4s ease-in-out infinite; }
      `}</style>

      <div className="relative overflow-hidden rounded-xl border border-[#F0A500]/20 bg-surface-1">

        {/* Bottom accent line (feed ha il top, community ha il bottom) */}
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#F0A500] to-transparent opacity-65" />

        {/* Sweep verticale */}
        <div className="comm-sweep pointer-events-none absolute inset-x-0 h-1/2 bg-gradient-to-b from-transparent via-[#F0A500]/5 to-transparent" />

        {/* Amber glow — top-right (opposto al feed) */}
        <div
          className="comm-glow pointer-events-none absolute -top-14 -right-14 h-52 w-52 rounded-full blur-3xl"
          style={{ background: '#F0A500' }}
        />

        {/* Cyan glow — bottom-left, statico */}
        <div
          className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full opacity-[0.07] blur-2xl"
          style={{ background: '#4ECDC4' }}
        />

        <div className="relative px-6 py-5 flex items-center gap-5">

          {/* Icon + orbit rotante */}
          <div className="relative shrink-0 flex items-center justify-center w-12 h-12">

            {/* SVG orbit: ruota tutto (ring + nodi) */}
            <div className="comm-orbit absolute" style={{ width: 52, height: 52, top: -4, left: -4 }}>
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                {/* Ring tratteggiato */}
                <circle
                  cx="26" cy="26" r="24"
                  stroke="#F0A500" strokeWidth="1"
                  strokeDasharray="3 6"
                  opacity="0.35"
                />
                {/* Nodo 1 — top (270°) */}
                <circle cx="26" cy="2" r="2.8" fill="#F0A500" className="comm-node-1" />
                {/* Nodo 2 — bottom-right (30°) */}
                <circle cx="46.8" cy="38" r="2.8" fill="#F0A500" className="comm-node-2" />
                {/* Nodo 3 — bottom-left (150°) */}
                <circle cx="5.2" cy="38" r="2.8" fill="#F0A500" className="comm-node-3" />
              </svg>
            </div>

            {/* Icon box */}
            <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-lg bg-[#F0A500]/10 border border-[#F0A500]/30">
              <svg width="22" height="22" fill="none" stroke="#F0A500" strokeWidth={1.7} viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
          </div>

          {/* Testo */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[1.15rem] font-heading font-bold text-text-primary tracking-tight mb-1">
              La <span className="gradient-text-cyan">Community</span>
            </h1>
            <p className="text-[0.8rem] text-text-muted leading-relaxed">
              Confrontati con altri professionisti BIM/AEC, condividi esperienze e impara insieme.
            </p>
          </div>

          {/* CTA — solo per utenti Pro */}
          {showNewButton && (
            <Link
              href="/community/nuova-discussione"
              className="shrink-0 flex items-center gap-2 bg-surface-2 border border-border-subtle hover:border-[#F0A500]/60 text-text-secondary hover:text-[#F0A500] px-4 py-2.5 rounded-sm text-[0.78rem] font-semibold transition-all"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nuova discussione
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
