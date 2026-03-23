export default function SimulazioniPage() {
  return (
    <div className="w-full px-6 lg:px-9 py-7">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-xl lg:text-[1.65rem] font-extrabold text-text-primary leading-tight mb-2">
          Simulazioni Esame
        </h1>
        <p className="text-text-secondary text-[0.82rem]">
          Preparati agli esami di certificazione BIM con simulazioni realistiche.
        </p>
      </div>

      {/* Coming soon card */}
      <div className="bg-surface-1 border border-border-subtle rounded-lg p-10 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-accent-amber/10 flex items-center justify-center mx-auto mb-5">
          <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="text-accent-amber">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
        </div>
        <h2 className="font-heading text-[1.1rem] font-bold text-text-primary mb-2">
          In arrivo
        </h2>
        <p className="text-text-secondary text-[0.82rem] leading-relaxed mb-6 max-w-sm mx-auto">
          Stiamo preparando simulazioni complete per gli esami di certificazione BIM: UNI 11337, buildingSMART Individual Qualification e altro ancora.
        </p>

        {/* Feature preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="bg-surface-2 rounded-md p-3">
            <p className="text-accent-cyan text-[0.72rem] font-bold font-heading mb-1">Timer realistico</p>
            <p className="text-text-muted text-[0.68rem] leading-snug">Simula le condizioni reali d&apos;esame con tempo limitato.</p>
          </div>
          <div className="bg-surface-2 rounded-md p-3">
            <p className="text-accent-cyan text-[0.72rem] font-bold font-heading mb-1">Domande randomizzate</p>
            <p className="text-text-muted text-[0.68rem] leading-snug">Ogni simulazione attinge da un ampio database di quesiti.</p>
          </div>
          <div className="bg-surface-2 rounded-md p-3">
            <p className="text-accent-cyan text-[0.72rem] font-bold font-heading mb-1">Analisi risultati</p>
            <p className="text-text-muted text-[0.68rem] leading-snug">Report dettagliato con le aree da migliorare.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
