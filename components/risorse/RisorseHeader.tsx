'use client';

export function RisorseHeader() {
  return (
    <>
      <style>{`
        @keyframes res-float-1 {
          0%, 100% { transform: translateY(0px)   rotate(-6deg); }
          50%       { transform: translateY(-8px)  rotate(-6deg); }
        }
        @keyframes res-float-2 {
          0%, 100% { transform: translateY(0px)   rotate(-2deg); }
          50%       { transform: translateY(-5px)  rotate(-2deg); }
        }
        @keyframes res-float-3 {
          0%, 100% { transform: translateY(0px)   rotate(3deg); }
          50%       { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes res-amber-breathe {
          0%, 100% { opacity: 0.09; }
          50%       { opacity: 0.24; }
        }
        .res-doc-1   { animation: res-float-1 3.8s ease-in-out 0s infinite; }
        .res-doc-2   { animation: res-float-2 3.8s ease-in-out 0.6s infinite; }
        .res-doc-3   { animation: res-float-3 3.8s ease-in-out 1.2s infinite; }
        .res-glow    { animation: res-amber-breathe 4.2s ease-in-out infinite; }
      `}</style>

      <div className="relative overflow-hidden rounded-xl border border-[#F0A500]/20 bg-surface-1">

        {/* Linea verticale destra */}
        <div className="absolute right-0 inset-y-0 w-[2px] bg-gradient-to-b from-transparent via-[#F0A500] to-transparent opacity-65" />

        {/* Documenti flottanti — sfondo destra */}
        <div className="pointer-events-none absolute right-8 inset-y-0 flex items-center">
          {/* Layer back */}
          <div
            className="res-doc-1 absolute w-14 h-16 rounded border border-[#F0A500]/25 bg-[#F0A500]/5"
            style={{ right: 28, top: '50%', marginTop: -32 }}
          />
          {/* Layer mid */}
          <div
            className="res-doc-2 absolute w-14 h-16 rounded border border-[#F0A500]/35 bg-[#F0A500]/7"
            style={{ right: 14, top: '50%', marginTop: -32 }}
          >
            {/* Righe testo simulate */}
            <div className="mt-3 mx-2.5 space-y-1.5">
              <div className="h-[3px] rounded-full bg-[#F0A500]/30 w-full" />
              <div className="h-[3px] rounded-full bg-[#F0A500]/20 w-3/4" />
              <div className="h-[3px] rounded-full bg-[#F0A500]/20 w-5/6" />
            </div>
          </div>
          {/* Layer front */}
          <div
            className="res-doc-3 absolute w-14 h-16 rounded border border-[#F0A500]/50 bg-[#F0A500]/10"
            style={{ right: 0, top: '50%', marginTop: -32 }}
          >
            <div className="mt-3 mx-2.5 space-y-1.5">
              <div className="h-[3px] rounded-full bg-[#F0A500]/50 w-full" />
              <div className="h-[3px] rounded-full bg-[#F0A500]/35 w-2/3" />
              <div className="h-[3px] rounded-full bg-[#F0A500]/35 w-5/6" />
              <div className="h-[3px] rounded-full bg-[#F0A500]/20 w-1/2" />
            </div>
          </div>
        </div>

        {/* Amber glow — bottom-left (posizione inedita) */}
        <div
          className="res-glow pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full blur-3xl"
          style={{ background: '#F0A500' }}
        />

        {/* Cyan glow — top-right, statico */}
        <div
          className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-[0.06] blur-2xl"
          style={{ background: '#4ECDC4' }}
        />

        <div className="relative px-6 py-5 flex items-center gap-5">

          {/* Icon — libro aperto */}
          <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-[#F0A500]/10 border border-[#F0A500]/30">
            <svg width="22" height="22" fill="none" stroke="#F0A500" strokeWidth={1.7} viewBox="0 0 24 24">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
              <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
          </div>

          {/* Testo */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[1.15rem] font-heading font-bold text-text-primary tracking-tight mb-1">
              Risorse
            </h1>
            <p className="text-[0.8rem] text-text-muted leading-relaxed">
              Articoli tecnici, approfondimenti BIM e rassegna stampa AERABIM.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
