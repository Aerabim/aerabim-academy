import Link from 'next/link';

export default function CourseNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-7xl font-bold text-brand-blue/40">404</div>
        <h1 className="text-xl font-bold text-white">Corso non trovato</h1>
        <p className="text-brand-gray text-sm">
          Il corso che cerchi non esiste o non è più disponibile.
        </p>
        <Link
          href="/catalogo-corsi"
          className="inline-block rounded-lg bg-cyan-500/20 px-6 py-2.5 text-sm font-medium text-cyan-400 hover:bg-cyan-500/30 transition-colors"
        >
          Torna al catalogo
        </Link>
      </div>
    </div>
  );
}
