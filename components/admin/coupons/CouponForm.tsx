'use client';

import { useState } from 'react';
import { FormField } from '@/components/admin/ui/FormField';
import { FormSelect } from '@/components/admin/ui/FormSelect';

interface CouponFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

const DISCOUNT_OPTIONS = [
  { value: 'percent', label: 'Percentuale (%)' },
  { value: 'amount', label: 'Importo fisso (€)' },
];

const DURATION_OPTIONS = [
  { value: 'once', label: 'Una volta' },
  { value: 'repeating', label: 'Ripetuto (mesi)' },
  { value: 'forever', label: 'Per sempre' },
];

export function CouponForm({ onCreated, onCancel }: CouponFormProps) {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [percentOff, setPercentOff] = useState('');
  const [amountOff, setAmountOff] = useState('');
  const [duration, setDuration] = useState('once');
  const [durationInMonths, setDurationInMonths] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError('');
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        code: code.trim(),
        discountType,
        duration,
      };

      if (discountType === 'percent') {
        payload.percentOff = Number(percentOff);
      } else {
        payload.amountOff = Math.round(Number(amountOff) * 100); // Convert EUR to cents
      }

      if (duration === 'repeating' && durationInMonths) {
        payload.durationInMonths = Number(durationInMonths);
      }

      if (maxRedemptions) {
        payload.maxRedemptions = Number(maxRedemptions);
      }

      if (expiresAt) {
        payload.expiresAt = expiresAt;
      }

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Errore nella creazione.');
        return;
      }

      onCreated();
    } catch {
      setError('Errore di rete.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-surface-2/50 border border-border-subtle rounded-md p-5">
      {error && (
        <div className="mb-4 px-4 py-3 bg-accent-rose/10 border border-accent-rose/20 rounded-md text-[0.82rem] text-accent-rose">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField
            label="Codice coupon"
            id="couponCode"
            value={code}
            onChange={setCode}
            placeholder="es. SCONTO20"
            required
            hint="Verrà convertito in maiuscolo"
          />
          <FormSelect
            label="Tipo sconto"
            id="discountType"
            value={discountType}
            onChange={setDiscountType}
            options={DISCOUNT_OPTIONS}
          />
          {discountType === 'percent' ? (
            <FormField
              label="Percentuale sconto"
              id="percentOff"
              type="number"
              value={percentOff}
              onChange={setPercentOff}
              placeholder="es. 20"
              required
              hint="Da 1 a 100"
            />
          ) : (
            <FormField
              label="Importo sconto (€)"
              id="amountOff"
              type="number"
              value={amountOff}
              onChange={setAmountOff}
              placeholder="es. 50.00"
              required
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormSelect
            label="Durata"
            id="duration"
            value={duration}
            onChange={setDuration}
            options={DURATION_OPTIONS}
          />
          {duration === 'repeating' && (
            <FormField
              label="Mesi di durata"
              id="durationMonths"
              type="number"
              value={durationInMonths}
              onChange={setDurationInMonths}
              placeholder="es. 3"
              required
            />
          )}
          <FormField
            label="Limite utilizzi"
            id="maxRedemptions"
            type="number"
            value={maxRedemptions}
            onChange={setMaxRedemptions}
            placeholder="Illimitato"
            hint="Lascia vuoto per illimitato"
          />
          <FormField
            label="Scadenza"
            id="expiresAt"
            type="datetime-local"
            value={expiresAt}
            onChange={setExpiresAt}
            hint="Lascia vuoto per nessuna scadenza"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !code.trim()}
            className="px-5 py-2 bg-accent-cyan/15 text-accent-cyan text-[0.82rem] font-semibold rounded-md border border-accent-cyan/20 hover:bg-accent-cyan/25 transition-colors disabled:opacity-50"
          >
            {saving ? 'Creazione...' : 'Crea coupon'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 text-[0.82rem] text-text-muted hover:text-text-primary transition-colors"
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}
