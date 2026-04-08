import Link from 'next/link';

interface PendingAlertProps {
  count: number;
}

export function PendingAlert({ count }: PendingAlertProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-4 bg-accent-amber/8 border border-accent-amber/25 rounded-lg px-5 py-3.5">
      <span className="shrink-0 w-8 h-8 rounded-full bg-accent-amber/15 flex items-center justify-center">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-accent-amber">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-[0.82rem] font-semibold text-accent-amber">
          {count === 1
            ? '1 richiesta sessione in attesa di risposta'
            : `${count} richieste sessioni in attesa di risposta`}
        </span>
        <p className="text-[0.75rem] text-text-muted mt-0.5">
          Gli utenti stanno aspettando una conferma per le loro sessioni live.
        </p>
      </div>
      <Link
        href="/admin/richieste-sessioni"
        className="shrink-0 text-[0.78rem] font-semibold text-accent-amber hover:text-white border border-accent-amber/40 hover:border-accent-amber/70 hover:bg-accent-amber/10 px-3.5 py-1.5 rounded-full transition-colors"
      >
        Gestisci →
      </Link>
    </div>
  );
}
