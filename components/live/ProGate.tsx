import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export function ProGate() {
  return (
    <Card topBorder="amber" className="text-center">
      <div className="px-6 py-8">
        <div className="text-3xl mb-3">
          <svg
            className="mx-auto text-accent-amber"
            width="40"
            height="40"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <h3 className="font-heading text-[1rem] font-bold text-text-primary mb-1.5">
          Sessioni Live riservate ai Pro
        </h3>
        <p className="text-[0.82rem] text-text-secondary max-w-md mx-auto mb-5">
          Accedi a webinar di gruppo e sessioni di mentoring 1-to-1 con il team AERABIM.
          Abbonati a Pro per prenotare le sessioni live.
        </p>
        <Link
          href="/catalogo-corsi"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-amber text-brand-dark font-semibold text-[0.82rem] rounded-lg hover:bg-accent-amber/90 transition-colors"
        >
          Scopri il piano Pro
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </Card>
  );
}
