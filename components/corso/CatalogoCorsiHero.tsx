'use client';

export function CatalogoCorsiHero() {
  return (
    <>
      <style>{`
        @keyframes cc-type {
          from { stroke-dashoffset: 220; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes cc-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cc-progress {
          from { transform: scaleX(0); opacity: 1; }
          to   { transform: scaleX(1); opacity: 1; }
        }
        @keyframes cc-cursor {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes cc-glow-c {
          0%, 100% { opacity: 0.12; }
          50%       { opacity: 0.30; }
        }
        @keyframes cc-glow-a {
          0%, 100% { opacity: 0.08; }
          50%       { opacity: 0.20; }
        }
        .cc-glow-c { animation: cc-glow-c 4s ease-in-out 0s    infinite; }
        .cc-glow-a { animation: cc-glow-a 4s ease-in-out 1.8s  infinite; }
      `}</style>

      <div
        className="relative overflow-hidden rounded-xl min-h-[300px] lg:min-h-[320px] border border-[#4ECDC4]/15"
        style={{ background: 'linear-gradient(135deg, #040B11 0%, #071a1f 55%, #040B11 100%)' }}
      >
        {/* LMS screen SVG — fixed size, right side */}
        <div className="pointer-events-none absolute right-10 lg:right-16 top-1/2 -translate-y-1/2">
          <svg width="240" height="175" viewBox="0 0 240 175" fill="none">

            {/* ── Window frame ── */}
            <rect x="8" y="8" width="224" height="158" rx="9"
              fill="#040B11" fillOpacity="0.75"
              stroke="#4ECDC4" strokeWidth="0.8" strokeOpacity="0.28"
            />
            {/* Title bar fill */}
            <rect x="9" y="9" width="222" height="23" rx="8"
              fill="#4ECDC4" fillOpacity="0.06"
            />
            <rect x="9" y="24" width="222" height="8"
              fill="#4ECDC4" fillOpacity="0.06"
            />
            {/* Separator */}
            <line x1="9" y1="32" x2="231" y2="32"
              stroke="#4ECDC4" strokeWidth="0.5" strokeOpacity="0.16"
            />

            {/* Traffic-light dots */}
            <circle cx="24" cy="20" r="3.5" fill="#ff5f57" opacity="0.60" />
            <circle cx="36" cy="20" r="3.5" fill="#febc2e" opacity="0.60" />
            <circle cx="48" cy="20" r="3.5" fill="#28c840" opacity="0.60" />

            {/* Title bar label placeholder */}
            <rect x="93" y="16" width="54" height="7" rx="2"
              fill="#4ECDC4" fillOpacity="0.10"
            />

            {/* ── Course title line — amber, thick ── */}
            <line
              x1="20" y1="50" x2="185" y2="50"
              stroke="#F0A500" strokeWidth="4.5" strokeLinecap="round"
              strokeDasharray="220" strokeDashoffset="220"
              style={{ animation: 'cc-type 0.55s ease-out 0.35s forwards' }}
            />

            {/* ── Subtitle line — cyan dim ── */}
            <line
              x1="20" y1="62" x2="128" y2="62"
              stroke="#4ECDC4" strokeWidth="2.5" strokeLinecap="round"
              strokeOpacity="0.45"
              strokeDasharray="220" strokeDashoffset="220"
              style={{ animation: 'cc-type 0.45s ease-out 0.82s forwards' }}
            />

            {/* ── Module row 1 ── */}
            <circle cx="24" cy="77" r="2.8"
              fill="#4ECDC4" opacity="0"
              style={{ animation: 'cc-fade-in 0.2s ease-out 1.18s forwards' }}
            />
            <line
              x1="32" y1="77" x2="152" y2="77"
              stroke="#4ECDC4" strokeWidth="3" strokeLinecap="round"
              strokeOpacity="0.65"
              strokeDasharray="220" strokeDashoffset="220"
              style={{ animation: 'cc-type 0.45s ease-out 1.18s forwards' }}
            />

            {/* ── Module row 2 ── */}
            <circle cx="24" cy="91" r="2.8"
              fill="#4ECDC4" opacity="0"
              style={{ animation: 'cc-fade-in 0.2s ease-out 1.55s forwards' }}
            />
            <line
              x1="32" y1="91" x2="175" y2="91"
              stroke="#4ECDC4" strokeWidth="3" strokeLinecap="round"
              strokeOpacity="0.65"
              strokeDasharray="220" strokeDashoffset="220"
              style={{ animation: 'cc-type 0.45s ease-out 1.55s forwards' }}
            />

            {/* ── Module row 3 ── */}
            <circle cx="24" cy="105" r="2.8"
              fill="#4ECDC4" opacity="0"
              style={{ animation: 'cc-fade-in 0.2s ease-out 1.92s forwards' }}
            />
            <line
              x1="32" y1="105" x2="140" y2="105"
              stroke="#4ECDC4" strokeWidth="3" strokeLinecap="round"
              strokeOpacity="0.65"
              strokeDasharray="220" strokeDashoffset="220"
              style={{ animation: 'cc-type 0.45s ease-out 1.92s forwards' }}
            />

            {/* ── Module row 4 — shorter, amber bullet (current) ── */}
            <circle cx="24" cy="119" r="2.8"
              fill="#F0A500" opacity="0"
              style={{ animation: 'cc-fade-in 0.2s ease-out 2.28s forwards' }}
            />
            <line
              x1="32" y1="119" x2="100" y2="119"
              stroke="#4ECDC4" strokeWidth="3" strokeLinecap="round"
              strokeOpacity="0.50"
              strokeDasharray="220" strokeDashoffset="220"
              style={{ animation: 'cc-type 0.38s ease-out 2.28s forwards' }}
            />

            {/* ── Blinking cursor ── */}
            <rect
              x="104" y="112" width="2.5" height="11" rx="1"
              fill="#4ECDC4" opacity="0"
              style={{
                animation: 'cc-fade-in 0.1s ease-out 2.68s forwards, cc-cursor 0.78s ease-in-out 2.78s infinite',
              }}
            />

            {/* ── Progress bar ── */}
            {/* Track */}
            <rect x="20" y="139" width="200" height="5" rx="2.5"
              fill="#4ECDC4" fillOpacity="0.10"
              opacity="0"
              style={{ animation: 'cc-fade-in 0.3s ease-out 2.75s forwards' }}
            />
            {/* Fill — scaleX from left */}
            <rect x="20" y="139" width="150" height="5" rx="2.5"
              fill="#F0A500" opacity="0"
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'left center',
                animation: 'cc-progress 1.0s ease-out 2.90s forwards',
              }}
            />
            {/* Percentage label */}
            <text
              x="224" y="145"
              textAnchor="end"
              fill="#F0A500" fontSize="7.5" fontFamily="monospace" fontWeight="bold"
              opacity="0"
              style={{ animation: 'cc-fade-in 0.3s ease-out 3.90s forwards' }}
            >75%</text>

          </svg>
        </div>

        {/* Cyan glow — near SVG */}
        <div className="cc-glow-c pointer-events-none absolute top-1/2 -translate-y-1/2 right-[18%] h-52 w-52 rounded-full blur-3xl"
          style={{ background: '#4ECDC4' }} />

        {/* Amber glow — top-left */}
        <div className="cc-glow-a pointer-events-none absolute -top-14 -left-14 h-52 w-52 rounded-full blur-3xl"
          style={{ background: '#F0A500' }} />

        {/* Content */}
        <div className="relative flex flex-col justify-end min-h-[300px] lg:min-h-[320px] p-8 lg:p-11 max-w-[520px]">

          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4ECDC4]/10 border border-[#4ECDC4]/28 text-[0.68rem] font-bold text-[#4ECDC4] uppercase tracking-widest">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ECDC4] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#4ECDC4]" />
              </span>
              Catalogo
            </span>
          </div>

          <h1 className="font-heading text-2xl lg:text-[2rem] font-extrabold text-text-primary leading-tight mb-3">
            Corsi <span className="gradient-text-cyan">BIM / AEC</span>
          </h1>

          <p className="text-text-secondary text-[0.84rem] leading-relaxed mb-6 max-w-md">
            Formazione professionale BIM per tecnici della Pubblica Amministrazione
            e liberi professionisti — dalla norma UNI&nbsp;11337 agli strumenti digitali.
          </p>

          <div className="flex flex-wrap gap-2">
            {['Teoria + pratica', 'Norma UNI 11337', 'Attestato incluso'].map((label) => (
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
