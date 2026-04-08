import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-brand-dark flex flex-col items-center justify-center px-6 text-center overflow-hidden">

      {/* Decorative orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            width: 500, height: 500,
            background: 'radial-gradient(circle, rgba(78,205,196,0.08) 0%, transparent 65%)',
            filter: 'blur(80px)',
            top: '5%', left: '10%',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 380, height: 380,
            background: 'radial-gradient(circle, rgba(240,165,0,0.07) 0%, transparent 65%)',
            filter: 'blur(70px)',
            bottom: '8%', right: '8%',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Brand label */}
        <span className="font-sans text-[0.72rem] tracking-[0.3em] text-text-muted uppercase">
          AERABIM S.R.L.
        </span>

        {/* 404 */}
        <h1
          className="font-heading font-bold leading-none select-none"
          style={{
            fontSize: 'clamp(6rem, 20vw, 13rem)',
            background: 'linear-gradient(135deg, #1D2F42 20%, #304057 55%, #58758C 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          404
        </h1>

        {/* Divider */}
        <div className="w-px h-10 bg-gradient-to-b from-transparent via-accent-cyan/30 to-transparent" />

        {/* Message */}
        <div className="space-y-2">
          <p className="font-heading text-[1.1rem] font-semibold text-text-primary">
            Pagina non trovata
          </p>
          <p className="font-sans text-[0.85rem] text-text-secondary max-w-xs leading-relaxed">
            La pagina che cerchi non esiste o è stata spostata.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3 mt-2 flex-wrap justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent-cyan text-brand-dark font-sans font-semibold text-[0.85rem] hover:bg-white transition-colors"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>
          <Link
            href="/catalogo-corsi"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-border-subtle text-text-secondary font-sans font-medium text-[0.85rem] hover:border-border-hover hover:text-text-primary transition-colors"
          >
            Catalogo corsi
          </Link>
        </div>
      </div>

      {/* Bottom label */}
      <span className="absolute bottom-6 font-sans text-[0.7rem] text-text-muted/30">
        © 2026 AERABIM S.R.L.
      </span>
    </div>
  );
}
