'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-5xl">⚠</div>
        <h1 className="text-xl font-bold text-white">Si è verificato un errore</h1>
        <p className="text-brand-gray text-sm">
          Non è stato possibile caricare questa pagina. Riprova tra qualche istante.
        </p>
        {error.digest && (
          <p className="text-xs text-brand-gray/50">Codice: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="rounded-lg bg-cyan-500/20 px-6 py-2.5 text-sm font-medium text-cyan-400 hover:bg-cyan-500/30 transition-colors"
        >
          Riprova
        </button>
      </div>
    </div>
  );
}
