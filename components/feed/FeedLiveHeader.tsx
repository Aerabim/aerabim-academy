'use client';

export function FeedLiveHeader() {
  return (
    <>
      <style>{`
        @keyframes radar-ring {
          0%   { transform: scale(0.85); opacity: 0.55; }
          100% { transform: scale(2.4);  opacity: 0; }
        }
        @keyframes sweep-x {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(500%); }
        }
        @keyframes glow-breathe {
          0%, 100% { opacity: 0.12; }
          50%       { opacity: 0.30; }
        }
        .feed-radar-1 { animation: radar-ring 2.8s ease-out infinite; }
        .feed-radar-2 { animation: radar-ring 2.8s ease-out 0.9s infinite; }
        .feed-radar-3 { animation: radar-ring 2.8s ease-out 1.8s infinite; }
        .feed-sweep   { animation: sweep-x 4s ease-in-out 0.6s infinite; }
        .feed-glow    { animation: glow-breathe 3.5s ease-in-out infinite; }
      `}</style>

      <div className="relative overflow-hidden rounded-xl border border-accent-cyan/20 bg-surface-1">

        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#4ECDC4] to-transparent opacity-70" />

        {/* Sweep shimmer */}
        <div className="feed-sweep pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#4ECDC4]/6 to-transparent" />

        {/* Cyan glow blob — breathes */}
        <div
          className="feed-glow pointer-events-none absolute -top-14 -left-14 h-52 w-52 rounded-full blur-3xl"
          style={{ background: '#4ECDC4' }}
        />

        {/* Amber glow — static */}
        <div
          className="pointer-events-none absolute -bottom-10 -right-10 h-36 w-36 rounded-full opacity-[0.09] blur-2xl"
          style={{ background: '#F0A500' }}
        />

        <div className="relative px-6 py-5 flex items-center gap-5">

          {/* Icon + radar rings */}
          <div className="relative shrink-0 flex items-center justify-center w-11 h-11">
            <div className="feed-radar-1 absolute inset-0 rounded-full border border-[#4ECDC4]/50" />
            <div className="feed-radar-2 absolute inset-0 rounded-full border border-[#4ECDC4]/35" />
            <div className="feed-radar-3 absolute inset-0 rounded-full border border-[#4ECDC4]/20" />

            <div className="relative z-10 flex items-center justify-center w-11 h-11 rounded-lg bg-[#4ECDC4]/10 border border-[#4ECDC4]/30">
              <svg width="22" height="22" fill="none" stroke="#4ECDC4" strokeWidth={1.7} viewBox="0 0 24 24">
                <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
                <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" />
                <circle cx="12" cy="12" r="2" fill="#4ECDC4" stroke="none" />
                <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" />
                <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-[1.15rem] font-heading font-bold text-text-primary tracking-tight">
                Feed
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#4ECDC4]/10 border border-[#4ECDC4]/25 text-[0.68rem] font-bold text-accent-cyan uppercase tracking-widest">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-cyan" />
                </span>
                Live
              </span>
            </div>
            <p className="text-[0.8rem] text-text-muted leading-relaxed">
              Attività in tempo reale della community AERABIM — corsi completati, nuovi iscritti, certificazioni, annunci.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
