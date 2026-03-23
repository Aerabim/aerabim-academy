import Link from 'next/link';

export default function ArticleNotFound() {
  return (
    <div className="w-full px-6 lg:px-9 py-7 text-center">
      <h1 className="font-heading text-xl font-bold text-text-primary mb-3">
        Articolo non trovato
      </h1>
      <p className="text-text-secondary text-[0.85rem] mb-5">
        L&apos;articolo che stai cercando non esiste o non è ancora stato pubblicato.
      </p>
      <Link
        href="/risorse"
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-cyan/15 text-accent-cyan text-[0.82rem] font-semibold rounded-md hover:bg-accent-cyan/25 transition-colors"
      >
        Torna alle risorse
      </Link>
    </div>
  );
}
