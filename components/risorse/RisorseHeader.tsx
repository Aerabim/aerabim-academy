'use client';

/* Constellation nodes */
const NODES = [
  { cx: 135, cy: 42,  r: 12, amber: true,  delay: 0    }, // 0 — hub centrale
  { cx: 50,  cy: 100, r: 8,  amber: false, delay: 0.5  }, // 1
  { cx: 220, cy: 78,  r: 8,  amber: true,  delay: 0.9  }, // 2
  { cx: 30,  cy: 178, r: 6,  amber: false, delay: 1.3  }, // 3
  { cx: 135, cy: 160, r: 10, amber: true,  delay: 0.7  }, // 4 — hub secondario
  { cx: 242, cy: 168, r: 6,  amber: false, delay: 1.6  }, // 5
  { cx: 88,  cy: 228, r: 7,  amber: false, delay: 1.1  }, // 6
  { cx: 192, cy: 228, r: 7,  amber: true,  delay: 1.8  }, // 7
  { cx: 24,  cy: 45,  r: 5,  amber: false, delay: 2.0  }, // 8
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [0, 4],
  [2, 5], [4, 6], [4, 7], [1, 4], [8, 1],
];

/* Edges con dash flow animato */
const FLOW_EDGES = new Set([
  `${0}-${1}`, `${0}-${4}`, `${0}-${2}`,
]);

export function RisorseHeader() {
  return (
    <>
      <style>{`
        @keyframes rk-node-pulse {
          0%, 100% { opacity: 0.82; transform: scale(1); }
          50%       { opacity: 1;    transform: scale(1.18); }
        }
        @keyframes rk-line-flow {
          from { stroke-dashoffset: 36; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes rk-glow-a {
          0%, 100% { opacity: 0.11; }
          50%       { opacity: 0.27; }
        }
        @keyframes rk-glow-v {
          0%, 100% { opacity: 0.07; }
          50%       { opacity: 0.18; }
        }
        .rk-flow { animation: rk-line-flow 2s linear infinite; }
        .rk-glow-a { animation: rk-glow-a 4s ease-in-out 0s   infinite; }
        .rk-glow-v { animation: rk-glow-v 4s ease-in-out 1.5s infinite; }
      `}</style>

      <div
        className="relative overflow-hidden rounded-xl min-h-[300px] lg:min-h-[320px] border border-[#F0A500]/15"
        style={{ background: 'linear-gradient(135deg, #040B11 0%, #0e0b1e 55%, #040B11 100%)' }}
      >
        {/* Constellation — dimensione fissa, non scala con la card */}
        <div className="pointer-events-none absolute right-10 lg:right-16 top-1/2 -translate-y-1/2">
          <svg width="270" height="255" viewBox="0 0 270 255" fill="none">

            {/* Connessioni statiche */}
            {EDGES.map(([a, b]) => {
              const na = NODES[a], nb = NODES[b];
              const key = `${a}-${b}`;
              const isFlow = FLOW_EDGES.has(key);
              return (
                <g key={key}>
                  {/* Rail fissa */}
                  <line
                    x1={na.cx} y1={na.cy} x2={nb.cx} y2={nb.cy}
                    stroke="#F0A500" strokeWidth="0.6" opacity="0.10"
                  />
                  {/* Dash flow sulle connessioni principali */}
                  {isFlow && (
                    <line
                      className="rk-flow"
                      x1={na.cx} y1={na.cy} x2={nb.cx} y2={nb.cy}
                      stroke="#F0A500" strokeWidth="1.2"
                      strokeDasharray="8 14" opacity="0.45"
                    />
                  )}
                </g>
              );
            })}

            {/* Connessioni secondarie con dash cyan */}
            {([[1,3],[4,6],[8,1]] as [number,number][]).map(([a, b]) => {
              const na = NODES[a], nb = NODES[b];
              return (
                <line
                  key={`c-${a}-${b}`}
                  x1={na.cx} y1={na.cy} x2={nb.cx} y2={nb.cy}
                  stroke="#4ECDC4" strokeWidth="0.5"
                  strokeDasharray="3 7" opacity="0.20"
                />
              );
            })}

            {/* Nodi */}
            {NODES.map((n, i) => (
              <g key={i}>
                {/* Anello glow */}
                <circle
                  cx={n.cx} cy={n.cy} r={n.r + 5}
                  fill={n.amber ? '#F0A500' : '#4ECDC4'}
                  opacity="0"
                  style={{
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                    animation: `rk-node-pulse ${2 + (i % 3) * 0.4}s ease-in-out ${n.delay}s infinite`,
                  }}
                />
                {/* Cerchio principale */}
                <circle
                  cx={n.cx} cy={n.cy} r={n.r}
                  fill={n.amber ? '#F0A500' : '#4ECDC4'}
                  opacity="0.88"
                  style={{
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                    animation: `rk-node-pulse ${2 + (i % 3) * 0.4}s ease-in-out ${n.delay}s infinite`,
                  }}
                />
                {/* Punto interno */}
                <circle cx={n.cx} cy={n.cy} r={n.r * 0.35} fill="#040B11" opacity="0.9" />
              </g>
            ))}

            {/* Text stubs — hub 0 */}
            <line x1="122" y1="62" x2="148" y2="62" stroke="#F0A500" strokeWidth="1.5" opacity="0.30" />
            <line x1="124" y1="67" x2="144" y2="67" stroke="#F0A500" strokeWidth="1"   opacity="0.18" />
            <line x1="126" y1="72" x2="146" y2="72" stroke="#F0A500" strokeWidth="1"   opacity="0.18" />

            {/* Text stubs — hub 4 */}
            <line x1="124" y1="178" x2="146" y2="178" stroke="#F0A500" strokeWidth="1.5" opacity="0.28" />
            <line x1="126" y1="183" x2="144" y2="183" stroke="#F0A500" strokeWidth="1"   opacity="0.16" />
          </svg>
        </div>

        {/* Amber glow */}
        <div className="rk-glow-a pointer-events-none absolute top-1/2 -translate-y-1/2 right-[18%] h-52 w-52 rounded-full blur-3xl"
          style={{ background: '#F0A500' }} />

        {/* Violet glow — top-left */}
        <div className="rk-glow-v pointer-events-none absolute -top-14 -left-14 h-52 w-52 rounded-full blur-3xl"
          style={{ background: '#7C3AED' }} />

        {/* Content */}
        <div className="relative flex flex-col justify-end min-h-[300px] lg:min-h-[320px] p-8 lg:p-11 max-w-[520px]">

          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0A500]/10 border border-[#F0A500]/28 text-[0.68rem] font-bold text-[#F0A500] uppercase tracking-widest">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F0A500] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F0A500]" />
              </span>
              Aggiornato
            </span>
          </div>

          <h1 className="font-heading text-2xl lg:text-[2rem] font-extrabold text-text-primary leading-tight mb-3">
            <span className="gradient-text-cyan">Risorse</span>
          </h1>

          <p className="text-text-secondary text-[0.84rem] leading-relaxed mb-6 max-w-md">
            Articoli tecnici, approfondimenti normativi e rassegna stampa AERABIM —
            tutto il sapere del settore in un unico posto.
          </p>

          <div className="flex flex-wrap gap-2">
            {['Articoli tecnici', 'Normativa BIM', 'Rassegna stampa'].map((label) => (
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
