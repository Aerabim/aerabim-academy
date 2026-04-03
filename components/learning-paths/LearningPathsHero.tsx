'use client';

export function LearningPathsHero() {
  return (
    <>
      <style>{`
        @keyframes lp-flow {
          from { stroke-dashoffset: 60; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes lp-ring-expand {
          0%   { transform: scale(1);   opacity: 0.65; }
          100% { transform: scale(3.8); opacity: 0; }
        }
        @keyframes lp-glow-c {
          0%, 100% { opacity: 0.14; }
          50%       { opacity: 0.32; }
        }
        @keyframes lp-glow-a {
          0%, 100% { opacity: 0.10; }
          50%       { opacity: 0.24; }
        }
        .lp-dash   { animation: lp-flow 1.6s linear infinite; }
        .lp-ring-1 { animation: lp-ring-expand 2.2s ease-out 0s    infinite; transform-box: fill-box; transform-origin: center; }
        .lp-ring-2 { animation: lp-ring-expand 2.2s ease-out 0.73s infinite; transform-box: fill-box; transform-origin: center; }
        .lp-ring-3 { animation: lp-ring-expand 2.2s ease-out 1.46s infinite; transform-box: fill-box; transform-origin: center; }
        .lp-glow-c { animation: lp-glow-c 3.8s ease-in-out 0s   infinite; }
        .lp-glow-a { animation: lp-glow-a 3.8s ease-in-out 1.4s infinite; }
      `}</style>

      <div className="relative overflow-hidden rounded-xl min-h-[300px] lg:min-h-[320px] border border-[#4ECDC4]/15"
        style={{ background: 'linear-gradient(135deg, #040B11 0%, #0f1f2e 55%, #0a1520 100%)' }}>

        {/* SVG path animato — sfondo */}
        <div className="pointer-events-none absolute inset-0">
          <svg
            width="100%" height="100%"
            viewBox="0 0 1600 240"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            {/* Rail — traccia fissa sottile */}
            <path
              d="M -30 210 C 150 210 250 60 450 60 S 680 175 870 115 S 1080 20 1300 70 S 1500 95 1700 75"
              stroke="#4ECDC4" strokeWidth="1" opacity="0.10"
            />

            {/* Flowing dashes — percorso in movimento */}
            <path
              className="lp-dash"
              d="M -30 210 C 150 210 250 60 450 60 S 680 175 870 115 S 1080 20 1300 70 S 1500 95 1700 75"
              stroke="#4ECDC4" strokeWidth="2"
              strokeDasharray="22 38" opacity="0.50"
            />

            {/* ── Node 1 — (450, 60) — amber ── */}
            <circle className="lp-ring-1" cx="450" cy="60" r="8" stroke="#F0A500" strokeWidth="1.2" fill="none" />
            <circle cx="450" cy="60" r="6.5" fill="#F0A500" opacity="0.92" />
            <circle cx="450" cy="60" r="2.8" fill="#040B11" />
            <line x1="450" y1="53" x2="450" y2="18" stroke="#F0A500" strokeWidth="1" strokeDasharray="2 4" opacity="0.35" />
            <text x="450" y="12" textAnchor="middle" fill="#F0A500" fontSize="9" fontFamily="monospace" opacity="0.55">01</text>

            {/* ── Node 2 — (870, 115) — amber ── */}
            <circle className="lp-ring-2" cx="870" cy="115" r="8" stroke="#F0A500" strokeWidth="1.2" fill="none" />
            <circle cx="870" cy="115" r="6.5" fill="#F0A500" opacity="0.92" />
            <circle cx="870" cy="115" r="2.8" fill="#040B11" />
            <line x1="870" y1="122" x2="870" y2="160" stroke="#F0A500" strokeWidth="1" strokeDasharray="2 4" opacity="0.35" />
            <text x="870" y="173" textAnchor="middle" fill="#F0A500" fontSize="9" fontFamily="monospace" opacity="0.55">02</text>

            {/* ── Node 3 — (1090, 49) — cyan ── */}
            <circle className="lp-ring-3" cx="1090" cy="49" r="8" stroke="#4ECDC4" strokeWidth="1.2" fill="none" />
            <circle cx="1090" cy="49" r="6.5" fill="#4ECDC4" opacity="0.92" />
            <circle cx="1090" cy="49" r="2.8" fill="#040B11" />
            <line x1="1090" y1="42" x2="1090" y2="13" stroke="#4ECDC4" strokeWidth="1" strokeDasharray="2 4" opacity="0.35" />
            <text x="1090" y="8" textAnchor="middle" fill="#4ECDC4" fontSize="9" fontFamily="monospace" opacity="0.55">03</text>
          </svg>
        </div>

        {/* Glow cyan — top-left */}
        <div className="lp-glow-c pointer-events-none absolute -top-16 -left-16 h-60 w-60 rounded-full blur-3xl"
          style={{ background: '#4ECDC4' }} />

        {/* Glow amber — bottom-center-right */}
        <div className="lp-glow-a pointer-events-none absolute -bottom-14 right-1/4 h-52 w-52 rounded-full blur-3xl"
          style={{ background: '#F0A500' }} />

        {/* Content — allineato al bottom-left come CatalogHero */}
        <div className="relative flex flex-col justify-end min-h-[300px] lg:min-h-[320px] p-8 lg:p-11 max-w-[600px]">

          {/* Pill "In arrivo" — stessa posizione del badge "In evidenza" del CatalogHero */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0A500]/10 border border-[#F0A500]/28 text-[0.68rem] font-bold text-[#F0A500] uppercase tracking-widest">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F0A500] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F0A500]" />
              </span>
              In arrivo
            </span>
          </div>

          <h1 className="font-heading text-2xl lg:text-[2rem] font-extrabold text-text-primary leading-tight mb-3">
            Learning <span className="gradient-text-cyan">Paths</span>
          </h1>

          <p className="text-text-secondary text-[0.84rem] leading-relaxed mb-6 max-w-md">
            Percorsi formativi strutturati per ruolo e obiettivo: dal BIM Specialist al Manager,
            un cammino chiaro verso la certificazione professionale.
          </p>

          {/* Feature tags — pill row */}
          <div className="flex flex-wrap gap-2">
            {['Per ruolo professionale', 'Multi-corso guidato', 'Certificato di percorso'].map((label) => (
              <span
                key={label}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[0.72rem] text-text-muted font-medium"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
