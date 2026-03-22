import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#040B11] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-7xl font-bold text-[#304057]">404</div>
        <h1 className="text-2xl font-bold text-white">Pagina non trovata</h1>
        <p className="text-[#9DB1BF]">
          La pagina che cerchi non esiste o è stata spostata.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-[#4ECDC4]/20 px-6 py-2.5 text-sm font-medium text-[#4ECDC4] hover:bg-[#4ECDC4]/30 transition-colors"
          >
            Vai alla dashboard
          </Link>
          <Link
            href="/catalogo-corsi"
            className="rounded-lg border border-[#304057]/30 px-6 py-2.5 text-sm font-medium text-[#9DB1BF] hover:bg-[#304057]/20 transition-colors"
          >
            Catalogo corsi
          </Link>
        </div>
      </div>
    </div>
  );
}
