'use client';

import { useState } from 'react';

interface SubscriptionSectionProps {
  plan: 'free' | 'pro' | 'team' | 'pa';
  periodEnd: string | null;
  stripeSubscriptionId: string | null;
}

const planLabels: Record<string, string> = {
  free: 'Free',
  pro: 'Pro Annuale',
  team: 'Team',
  pa: 'Pubblica Amministrazione',
};

export function SubscriptionSection({ plan, periodEnd, stripeSubscriptionId }: SubscriptionSectionProps) {
  const [canceling, setCanceling] = useState(false);
  const [canceled, setCanceled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasActiveSubscription = plan !== 'free' && stripeSubscriptionId;

  async function handleCancel() {
    if (!confirm('Sei sicuro di voler cancellare il tuo abbonamento? L\'accesso resterà attivo fino alla fine del periodo corrente.')) {
      return;
    }

    setCanceling(true);
    setError(null);

    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stripeSubscriptionId }),
      });

      if (!res.ok) {
        const data = await res.json() as { error: string };
        setError(data.error || 'Errore durante la cancellazione.');
        return;
      }

      setCanceled(true);
    } catch {
      setError('Errore di connessione. Riprova.');
    } finally {
      setCanceling(false);
    }
  }

  const formattedDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="rounded-xl border border-brand-blue/20 bg-gradient-to-br from-brand-blue/10 to-brand-dark/50 p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Il tuo abbonamento</h2>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-brand-light">Piano attuale:</span>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            plan === 'free'
              ? 'bg-brand-blue/20 text-brand-light'
              : 'bg-cyan-500/20 text-cyan-400'
          }`}>
            {planLabels[plan] ?? plan}
          </span>
        </div>

        {formattedDate && (
          <p className="text-sm text-brand-gray">
            {canceled
              ? `Abbonamento cancellato. Accesso attivo fino al ${formattedDate}.`
              : `Prossimo rinnovo: ${formattedDate}`
            }
          </p>
        )}

        {!hasActiveSubscription && plan === 'free' && (
          <p className="text-sm text-brand-gray">
            Non hai un abbonamento attivo. Esplora il{' '}
            <a href="/catalogo-corsi" className="text-cyan-400 hover:underline">catalogo corsi</a>{' '}
            per iniziare.
          </p>
        )}

        {hasActiveSubscription && !canceled && (
          <>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button
              onClick={handleCancel}
              disabled={canceling}
              className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-5 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {canceling ? 'Cancellazione in corso...' : 'Cancella abbonamento'}
            </button>
          </>
        )}

        {canceled && (
          <p className="text-sm text-amber-400">
            Il tuo abbonamento è stato cancellato. Potrai continuare ad accedere ai contenuti fino alla fine del periodo corrente.
          </p>
        )}
      </div>
    </div>
  );
}
