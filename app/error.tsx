'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#040B11] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">⚠</div>
        <h1 className="text-2xl font-bold text-white">Qualcosa è andato storto</h1>
        <p className="text-[#9DB1BF]">
          Si è verificato un errore imprevisto. Riprova o torna alla pagina principale.
        </p>
        {error.digest && (
          <p className="text-xs text-[#58758C]">Codice errore: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-[#4ECDC4]/20 px-6 py-2.5 text-sm font-medium text-[#4ECDC4] hover:bg-[#4ECDC4]/30 transition-colors"
          >
            Riprova
          </button>
          <a
            href="/dashboard"
            className="rounded-lg border border-[#304057]/30 px-6 py-2.5 text-sm font-medium text-[#9DB1BF] hover:bg-[#304057]/20 transition-colors"
          >
            Vai alla dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
