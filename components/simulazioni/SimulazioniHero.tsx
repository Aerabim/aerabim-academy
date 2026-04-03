'use client';

/* cx=95 cy=95 r=80 — viewBox 190×190 */
const TICKS = Array.from({ length: 12 }, (_, i) => ({
  angle: i * 30,
  major: i % 3 === 0,
}));

export function SimulazioniHero() {
  return (
    <>
      <style>{`
        @keyframes sim-rotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes sim-arc {
          0%        { stroke-dashoffset: 471; opacity: 0.55; }
          78%       { stroke-dashoffset: 0;   opacity: 0.55; }
          92%, 100% { stroke-dashoffset: 0;   opacity: 0; }
        }
        @keyframes sim-glow-a {
          0%, 100% { opacity: 0.11; }
          50%      { opacity: 0.28; }
        }
        @keyframes sim-glow-c {
          0%, 100% { opacity: 0.07; }
          50%      { opacity: 0.17; }
        }
        .sim-hand   {
          transform-box: fill-box;
          transform-origin: 50% 100%;
          animation: sim-rotate 10s linear infinite;
        }
        .sim-arc    { animation: sim-arc 7s ease-in-out infinite; }
        .sim-glow-a { animation: sim-glow-a 4.2s ease-in-out 0s   infinite; }
        .sim-glow-c { animation: sim-glow-c 4.2s ease-in-out 1.6s infinite; }
      `}</style>

      <div
        className="relative overflow-hidden rounded-xl min-h-[300px] lg:min-h-[320px] border border-[#F0A500]/15"
        style={{ background: 'linear-gradient(135deg, #040B11 0%, #1c1305 55%, #070b14 100%)' }}
      >
        {/* Clock — dimensione fissa, non scala con la card */}
        <div className="pointer-events-none absolute right-10 lg:right-16 top-1/2 -translate-y-1/2">
          <svg width="190" height="190" viewBox="0 0 190 190" fill="none">
            {/* Ring esterno r=80 */}
            <circle cx="95" cy="95" r="80" stroke="#F0A500" strokeWidth="0.8" opacity="0.13" />
            {/* Ring interno tratteggiato */}
            <circle cx="95" cy="95" r="61" stroke="#F0A500" strokeWidth="0.5" strokeDasharray="3 8" opacity="0.07" />

            {/* Arco countdown — circumferenza 2π×80≈503 */}
            <circle
              className="sim-arc"
              cx="95" cy="95" r="80"
              stroke="#F0A500" strokeWidth="2.5" strokeDasharray="503"
              strokeLinecap="round"
              style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: 'rotate(-90deg)' }}
            />

            {/* Tacche */}
            {TICKS.map(({ angle, major }) => (
              <line
                key={angle}
                x1="95" y1="15" x2="95" y2={major ? 31 : 24}
                stroke="#F0A500"
                strokeWidth={major ? 1.5 : 0.7}
                opacity={major ? 0.45 : 0.18}
                transform={`rotate(${angle}, 95, 95)`}
              />
            ))}

            {/* Lancetta rotante */}
            <line
              className="sim-hand"
              x1="95" y1="23" x2="95" y2="95"
              stroke="#4ECDC4" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"
            />
            {/* Pivot */}
            <circle cx="95" cy="95" r="5" fill="#4ECDC4" opacity="0.9" />
            <circle cx="95" cy="95" r="2.2" fill="#040B11" />
          </svg>
        </div>

        {/* Amber glow — zona orologio */}
        <div className="sim-glow-a pointer-events-none absolute top-1/2 -translate-y-1/2 right-[15%] h-52 w-52 rounded-full blur-3xl"
          style={{ background: '#F0A500' }} />

        {/* Cyan glow — top-left */}
        <div className="sim-glow-c pointer-events-none absolute -top-14 -left-14 h-48 w-48 rounded-full blur-3xl"
          style={{ background: '#4ECDC4' }} />

        {/* Content */}
        <div className="relative flex flex-col justify-end min-h-[300px] lg:min-h-[320px] p-8 lg:p-11 max-w-[520px]">
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
            Simulazioni <span className="gradient-text-cyan">Esame</span>
          </h1>

          <p className="text-text-secondary text-[0.84rem] leading-relaxed mb-6 max-w-md">
            Preparati agli esami di certificazione BIM in condizioni reali: timer, domande
            randomizzate e analisi dei risultati per ogni simulazione.
          </p>

          <div className="flex flex-wrap gap-2">
            {['Timer realistico', 'Domande randomizzate', 'Analisi risultati'].map((label) => (
              <span key={label} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[0.72rem] text-text-muted font-medium">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
