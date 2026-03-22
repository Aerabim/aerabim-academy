'use client';

import { useState } from 'react';
import type { SessionRequestSlot } from '@/types';

const SLOT_OPTIONS: { value: SessionRequestSlot; label: string; hours: string }[] = [
  { value: 'mattina', label: 'Mattina', hours: '9:00 – 12:00' },
  { value: 'pomeriggio', label: 'Pomeriggio', hours: '14:00 – 17:00' },
  { value: 'sera', label: 'Sera', hours: '18:00 – 20:00' },
];

interface RequestSessionFormProps {
  onSuccess: () => void;
}

export function RequestSessionForm({ onSuccess }: RequestSessionFormProps) {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [preferredWeek, setPreferredWeek] = useState('');
  const [preferredSlot, setPreferredSlot] = useState<SessionRequestSlot | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate min date (next Monday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  const minDate = nextMonday.toISOString().split('T')[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!topic.trim()) {
      setError('Inserisci un argomento.');
      return;
    }
    if (!preferredWeek) {
      setError('Seleziona una settimana.');
      return;
    }
    if (!preferredSlot) {
      setError('Seleziona una fascia oraria.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/session-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          description: description.trim() || undefined,
          preferredWeek,
          preferredSlot,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || 'Errore durante l\'invio.');
        return;
      }

      onSuccess();
    } catch {
      setError('Errore di connessione. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Topic */}
      <div>
        <label htmlFor="topic" className="block text-[0.78rem] font-semibold text-text-primary mb-1.5">
          Argomento *
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Es: Configurazione famiglie Revit, Clash detection con Navisworks..."
          className="w-full bg-surface-2 border border-border-subtle rounded-sm px-3.5 py-2.5 text-[0.82rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan transition-colors"
          maxLength={200}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-[0.78rem] font-semibold text-text-primary mb-1.5">
          Dettagli aggiuntivi
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrivi brevemente cosa vorresti approfondire, il tuo livello di esperienza, eventuali problemi specifici..."
          rows={3}
          className="w-full bg-surface-2 border border-border-subtle rounded-sm px-3.5 py-2.5 text-[0.82rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan transition-colors resize-none"
          maxLength={1000}
        />
      </div>

      {/* Preferred week */}
      <div>
        <label htmlFor="week" className="block text-[0.78rem] font-semibold text-text-primary mb-1.5">
          Settimana preferita *
        </label>
        <input
          id="week"
          type="date"
          value={preferredWeek}
          onChange={(e) => setPreferredWeek(e.target.value)}
          min={minDate}
          className="w-full bg-surface-2 border border-border-subtle rounded-sm px-3.5 py-2.5 text-[0.82rem] text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
        />
        <p className="text-[0.68rem] text-text-muted mt-1">
          Seleziona il lunedì della settimana in cui preferisci la sessione.
        </p>
      </div>

      {/* Preferred slot */}
      <div>
        <label className="block text-[0.78rem] font-semibold text-text-primary mb-2">
          Fascia oraria preferita *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {SLOT_OPTIONS.map((slot) => (
            <button
              key={slot.value}
              type="button"
              onClick={() => setPreferredSlot(slot.value)}
              className={`flex flex-col items-center gap-0.5 px-3 py-3 rounded-sm border text-center transition-all ${
                preferredSlot === slot.value
                  ? 'bg-accent-cyan-dim border-accent-cyan text-accent-cyan'
                  : 'bg-surface-2 border-border-subtle text-text-secondary hover:border-border-hover hover:text-text-primary'
              }`}
            >
              <span className="text-[0.8rem] font-semibold">{slot.label}</span>
              <span className="text-[0.65rem] opacity-70">{slot.hours}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-accent-rose/10 border border-accent-rose/20 rounded-sm px-3.5 py-2.5 text-[0.78rem] text-accent-rose">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent-cyan text-brand-dark font-semibold text-[0.82rem] py-2.5 rounded-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Invio in corso...' : 'Invia richiesta'}
      </button>
    </form>
  );
}
