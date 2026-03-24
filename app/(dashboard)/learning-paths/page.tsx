export default function LearningPathsPage() {
  return (
    <div className="w-full px-6 lg:px-9 py-7">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-xl lg:text-[1.65rem] font-extrabold text-text-primary leading-tight mb-2">
          Learning <span className="gradient-text-cyan">Paths</span>
        </h1>
        <p className="text-text-secondary text-[0.82rem]">
          Percorsi formativi guidati per ruolo e obiettivo professionale.
        </p>
      </div>

      {/* Coming soon card */}
      <div className="bg-surface-1 border border-border-subtle rounded-lg p-10 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-accent-cyan/10 flex items-center justify-center mx-auto mb-5">
          <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="text-accent-cyan">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <h2 className="font-heading text-[1.1rem] font-bold text-text-primary mb-2">
          In arrivo
        </h2>
        <p className="text-text-secondary text-[0.82rem] leading-relaxed mb-6 max-w-sm mx-auto">
          Stiamo costruendo percorsi strutturati che ti guideranno passo dopo passo verso i tuoi obiettivi professionali nel mondo BIM e AEC.
        </p>

        {/* Feature preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="bg-surface-2 rounded-md p-3">
            <p className="text-accent-cyan text-[0.72rem] font-bold font-heading mb-1">Per ruolo</p>
            <p className="text-text-muted text-[0.68rem] leading-snug">Percorsi dedicati per BIM Specialist, Coordinator e Manager.</p>
          </div>
          <div className="bg-surface-2 rounded-md p-3">
            <p className="text-accent-cyan text-[0.72rem] font-bold font-heading mb-1">Multi-corso</p>
            <p className="text-text-muted text-[0.68rem] leading-snug">Combinazioni ottimali di corsi con ordine consigliato.</p>
          </div>
          <div className="bg-surface-2 rounded-md p-3">
            <p className="text-accent-cyan text-[0.72rem] font-bold font-heading mb-1">Progresso guidato</p>
            <p className="text-text-muted text-[0.68rem] leading-snug">Traccia i tuoi avanzamenti e ottieni certificati di percorso.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
