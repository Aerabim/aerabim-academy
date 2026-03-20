export function BimAlertBanner() {
  return (
    <div className="bg-gradient-to-r from-accent-amber/[0.07] to-accent-cyan/[0.04] border border-accent-amber/[0.18] rounded-md px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-accent-amber/[0.35] hover:-translate-y-px transition-all group">
      <div className="w-[42px] h-[42px] rounded-full bg-accent-amber/10 flex items-center justify-center text-xl shrink-0">
        ⚡
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-heading text-[0.82rem] font-bold text-accent-amber flex items-center gap-2">
          BIM Alert — Aggiornamento Normativo
          <span className="font-heading text-[0.55rem] px-1.5 py-0.5 rounded bg-accent-amber text-brand-dark font-extrabold uppercase tracking-wider">
            New
          </span>
        </div>
        <div className="text-[0.78rem] text-text-secondary mt-0.5">
          Pubblicate le nuove Linee Guida MIT 2026. Corso aggiornato con le ultime modifiche.
        </div>
      </div>
      <div className="text-accent-amber text-lg group-hover:translate-x-1 transition-transform shrink-0">
        →
      </div>
    </div>
  );
}
