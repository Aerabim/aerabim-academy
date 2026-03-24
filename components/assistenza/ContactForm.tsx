'use client';

import { useState } from 'react';

const CATEGORIES = [
  { value: 'account', label: 'Account e accesso' },
  { value: 'pagamenti', label: 'Pagamenti e fatturazione' },
  { value: 'corsi', label: 'Corsi e contenuti' },
  { value: 'certificati', label: 'Certificati' },
  { value: 'tecnico', label: 'Problema tecnico' },
  { value: 'altro', label: 'Altro' },
];

export function ContactForm() {
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/assistenza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subject, message }),
      });

      if (res.ok) {
        setResult({ ok: true, text: 'Messaggio inviato! Ti risponderemo il prima possibile.' });
        setCategory('');
        setSubject('');
        setMessage('');
      } else {
        const data = await res.json();
        setResult({ ok: false, text: data.error || 'Errore nell\'invio. Riprova.' });
      }
    } catch {
      setResult({ ok: false, text: 'Errore di rete. Riprova.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-1.5">
          Categoria
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="w-full px-3 py-2.5 bg-surface-0 border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20 transition-colors"
        >
          <option value="">Seleziona una categoria</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-text-secondary mb-1.5">
          Oggetto
        </label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          maxLength={200}
          placeholder="Descrivi brevemente il problema"
          className="w-full px-3 py-2.5 bg-surface-0 border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20 transition-colors"
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-text-secondary mb-1.5">
          Messaggio
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          maxLength={3000}
          placeholder="Descrivi in dettaglio come possiamo aiutarti..."
          className="w-full px-3 py-2.5 bg-surface-0 border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20 transition-colors resize-y"
        />
      </div>

      {/* Result message */}
      {result && (
        <p className={`text-sm ${result.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
          {result.text}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={sending}
        className="w-full sm:w-auto px-6 py-2.5 bg-accent-cyan text-brand-dark text-sm font-medium rounded-lg hover:bg-accent-cyan/90 transition-colors disabled:opacity-50"
      >
        {sending ? 'Invio in corso...' : 'Invia messaggio'}
      </button>
    </form>
  );
}
