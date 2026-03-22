'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import type { CheckoutRequest, CheckoutResponse, ApiError } from '@/types';

interface PurchaseCardProps {
  courseId: string;
  courseSlug: string;
  priceSingle: number;
  isFree: boolean;
  isEnrolled: boolean;
  isAuthenticated: boolean;
}

export function PurchaseCard({
  courseId,
  courseSlug,
  priceSingle,
  isFree,
  isEnrolled,
  isAuthenticated,
}: PurchaseCardProps) {
  const [loading, setLoading] = useState<'single' | 'pro' | 'free' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(type: CheckoutRequest['type']) {
    if (!isAuthenticated) {
      window.location.href = `/login?redirectTo=/catalogo-corsi/${courseSlug}`;
      return;
    }

    setError(null);
    setLoading(type === 'free' ? 'free' : type === 'single' ? 'single' : 'pro');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, courseSlug, type } satisfies CheckoutRequest),
      });

      if (!res.ok) {
        const data = (await res.json()) as ApiError;
        setError(data.error || 'Si è verificato un errore.');
        setLoading(null);
        return;
      }

      const data = (await res.json()) as CheckoutResponse;
      window.location.href = data.url;
    } catch {
      setError('Errore di connessione. Riprova.');
      setLoading(null);
    }
  }

  // Already enrolled
  if (isEnrolled) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-accent-emerald">
            <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-heading text-[0.85rem] font-bold text-accent-emerald">Sei iscritto</span>
        </div>
        <Link
          href={`/learn/${courseId}`}
          className="block w-full text-center font-heading text-[0.82rem] font-bold bg-accent-cyan text-brand-dark py-2.5 rounded-md hover:brightness-110 transition-all"
        >
          Vai al corso
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      {/* Price */}
      <div className="mb-4">
        {isFree ? (
          <span className="font-heading text-xl font-extrabold text-accent-emerald">Gratuito</span>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-xl font-extrabold text-text-primary">
              {formatPrice(priceSingle)}
            </span>
            <span className="text-text-muted text-[0.68rem]">IVA inclusa</span>
          </div>
        )}
      </div>

      {/* Primary CTA */}
      <button
        onClick={() => handleCheckout(isFree ? 'free' : 'single')}
        disabled={loading !== null}
        className="w-full font-heading text-[0.82rem] font-bold bg-accent-cyan text-brand-dark py-2.5 rounded-md hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === 'single' || loading === 'free' ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
            Attendere...
          </span>
        ) : isFree ? (
          'Inizia gratis'
        ) : (
          'Acquista corso'
        )}
      </button>

      {/* Pro subscription option (only for paid courses) */}
      {!isFree && (
        <>
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-border-subtle" />
            <span className="text-text-muted text-[0.65rem] uppercase tracking-wider">oppure</span>
            <div className="flex-1 h-px bg-border-subtle" />
          </div>

          <button
            onClick={() => handleCheckout('pro_subscription')}
            disabled={loading !== null}
            className="w-full font-heading text-[0.78rem] font-semibold border border-accent-cyan/40 text-accent-cyan py-2.5 rounded-md hover:bg-accent-cyan/[0.06] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'pro' ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>
                Attendere...
              </span>
            ) : (
              <>Abbonati Pro · Tutti i corsi</>
            )}
          </button>
          <p className="text-text-muted text-[0.62rem] text-center mt-2">
            Accesso illimitato a tutti i corsi del catalogo
          </p>
        </>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-3 text-accent-rose text-[0.72rem] text-center">{error}</p>
      )}
    </Card>
  );
}
