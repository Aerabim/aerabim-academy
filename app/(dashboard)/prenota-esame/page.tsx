export default function PrenotaEsamePage() {
  return (
    <div className="w-full px-6 lg:px-9 py-7">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-xl lg:text-[1.65rem] font-extrabold text-text-primary leading-tight mb-2">
          Prenota Esame
        </h1>
        <p className="text-text-secondary text-[0.82rem]">
          Prenota il tuo esame di certificazione BIM direttamente dalla piattaforma.
        </p>
      </div>

      {/* Coming soon card */}
      <div className="bg-surface-1 border border-border-subtle rounded-lg p-10 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-accent-amber/10 flex items-center justify-center mx-auto mb-5">
          <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="text-accent-amber">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <h2 className="font-heading text-[1.1rem] font-bold text-text-primary mb-2">
          In arrivo
        </h2>
        <p className="text-text-secondary text-[0.82rem] leading-relaxed mb-6 max-w-sm mx-auto">
          Presto potrai prenotare esami di certificazione BIM ufficiali tramite AERABIM: scegli la data, la sede e paga direttamente online.
        </p>

        {/* Feature preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="bg-surface-2 rounded-md p-3">
            <p className="text-accent-cyan text-[0.72rem] font-bold font-heading mb-1">Calendario esami</p>
            <p className="text-text-muted text-[0.68rem] leading-snug">Visualizza le date disponibili e scegli quella pi&ugrave; comoda.</p>
          </div>
          <div className="bg-surface-2 rounded-md p-3">
            <p className="text-accent-cyan text-[0.72rem] font-bold font-heading mb-1">Sedi certificate</p>
            <p className="text-text-muted text-[0.68rem] leading-snug">Esami in presenza o da remoto presso centri convenzionati.</p>
          </div>
          <div className="bg-surface-2 rounded-md p-3">
            <p className="text-accent-cyan text-[0.72rem] font-bold font-heading mb-1">Sconto Pro</p>
            <p className="text-text-muted text-[0.68rem] leading-snug">Tariffa agevolata per gli abbonati al piano Pro.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
