'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface StripePrice {
  id: string;
  label: string;
}

interface StripePriceSelectProps {
  value: string;
  onChange: (priceId: string) => void;
}

export function StripePriceSelect({ value, onChange }: StripePriceSelectProps) {
  const [prices, setPrices] = useState<StripePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/stripe-prices');
        if (res.ok) {
          const data = await res.json();
          setPrices(data.prices ?? []);
        } else {
          setError('Impossibile caricare i prezzi Stripe.');
        }
      } catch {
        setError('Errore di rete.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div className="space-y-1.5">
        <label className="block text-[0.78rem] font-medium text-text-secondary">Prezzo Stripe</label>
        <div className="text-[0.72rem] text-accent-rose">{error}</div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="price_..."
          className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-md text-[0.82rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20 transition-all"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-[0.78rem] font-medium text-text-secondary">Prezzo Stripe</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className={cn(
          'w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-md text-[0.82rem] text-text-primary',
          'focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20 transition-all',
          'appearance-none',
          loading && 'opacity-50',
        )}
      >
        <option value="">{loading ? 'Caricamento...' : 'Nessun prezzo (gratuito)'}</option>
        {prices.map((p) => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </select>
      {value && (
        <div className="text-[0.68rem] text-text-muted font-mono">{value}</div>
      )}
    </div>
  );
}
