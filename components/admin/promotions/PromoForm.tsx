'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type {
  Promotion,
  CreatePromotionPayload,
  PromoType,
  PromoTheme,
  PromoFrequency,
  PromoAudience,
} from '@/types';

interface PromoFormProps {
  initial?: Promotion;
  onSaved: (promo: Promotion) => void;
  onCancel: () => void;
}

const THEME_OPTIONS: { value: PromoTheme; label: string; dot: string }[] = [
  { value: 'amber', label: 'Amber (urgenza)', dot: 'bg-accent-amber' },
  { value: 'cyan',  label: 'Cyan (lancio)',   dot: 'bg-accent-cyan'  },
  { value: 'red',   label: 'Red (scadenza)',  dot: 'bg-accent-rose'  },
  { value: 'green', label: 'Green (regalo)',  dot: 'bg-accent-emerald'},
];

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 16); // "YYYY-MM-DDTHH:MM"
}

export function PromoForm({ initial, onSaved, onCancel }: PromoFormProps) {
  const isEdit = !!initial;

  const [name, setName]               = useState(initial?.name ?? '');
  const [type, setType]               = useState<PromoType>(initial?.type ?? 'banner');
  const [title, setTitle]             = useState(initial?.title ?? '');
  const [body, setBody]               = useState(initial?.body ?? '');
  const [ctaLabel, setCtaLabel]       = useState(initial?.cta_label ?? '');
  const [ctaUrl, setCtaUrl]           = useState(initial?.cta_url ?? '');
  const [badgeLabel, setBadgeLabel]   = useState(initial?.badge_label ?? '');
  const [theme, setTheme]             = useState<PromoTheme>(initial?.theme ?? 'amber');
  const [startsAt, setStartsAt]       = useState(toDatetimeLocal(initial?.starts_at));
  const [endsAt, setEndsAt]           = useState(toDatetimeLocal(initial?.ends_at));
  const [popupDelay, setPopupDelay]   = useState(initial?.popup_delay_sec ?? 3);
  const [popupFreq, setPopupFreq]     = useState<PromoFrequency>(initial?.popup_frequency ?? 'once');
  const [audience, setAudience]       = useState<PromoAudience>(initial?.target_audience ?? 'all');

  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim())  { setError('Il nome interno è obbligatorio.'); return; }
    if (!title.trim()) { setError('Il titolo pubblico è obbligatorio.'); return; }

    setSaving(true);
    try {
      const payload: CreatePromotionPayload = {
        name: name.trim(),
        type,
        title: title.trim(),
        body: body.trim() || undefined,
        cta_label: ctaLabel.trim() || undefined,
        cta_url: ctaUrl.trim() || undefined,
        badge_label: badgeLabel.trim() || undefined,
        theme,
        starts_at: startsAt ? new Date(startsAt).toISOString() : undefined,
        ends_at: endsAt ? new Date(endsAt).toISOString() : undefined,
        popup_delay_sec: type === 'popup' ? popupDelay : undefined,
        popup_frequency: type === 'popup' ? popupFreq : undefined,
        target_audience: audience,
      };

      const url    = isEdit ? `/api/admin/promotions/${initial!.id}` : '/api/admin/promotions';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json() as { promotion?: Promotion; error?: string };
      if (!res.ok) { setError(data.error ?? 'Errore nel salvataggio.'); return; }
      onSaved(data.promotion!);
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = 'w-full px-3 py-2 text-[0.82rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-amber/50 transition-colors';
  const labelClass = 'block text-[0.75rem] font-semibold text-text-secondary mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-surface-1 border border-border-subtle rounded-xl p-6">
      <h3 className="font-heading font-bold text-[0.95rem] text-text-primary">
        {isEdit ? 'Modifica promozione' : 'Nuova promozione'}
      </h3>

      {/* Row: nome + tipo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nome interno *</label>
          <input
            className={fieldClass}
            placeholder="es. Black Friday 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Tipo *</label>
          <select className={fieldClass} value={type} onChange={(e) => setType(e.target.value as PromoType)}>
            <option value="banner">Banner (striscia in cima)</option>
            <option value="popup">Popup modale</option>
          </select>
        </div>
      </div>

      {/* Titolo + badge */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Titolo pubblico *</label>
          <input
            className={fieldClass}
            placeholder="es. Black Friday — 48 ore di sconti"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Badge label</label>
          <input
            className={fieldClass}
            placeholder="es. −40%"
            value={badgeLabel}
            onChange={(e) => setBadgeLabel(e.target.value)}
          />
        </div>
      </div>

      {/* Corpo */}
      <div>
        <label className={labelClass}>Testo descrittivo</label>
        <input
          className={fieldClass}
          placeholder="es. Solo fino a domenica mezzanotte."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      {/* CTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Label CTA</label>
          <input
            className={fieldClass}
            placeholder="es. Approfitta ora"
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>URL CTA</label>
          <input
            className={fieldClass}
            placeholder="/corsi o URL assoluto"
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
          />
        </div>
      </div>

      {/* Tema + Audience */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Tema colore</label>
          <select className={fieldClass} value={theme} onChange={(e) => setTheme(e.target.value as PromoTheme)}>
            {THEME_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Target audience</label>
          <select className={fieldClass} value={audience} onChange={(e) => setAudience(e.target.value as PromoAudience)}>
            <option value="all">Tutti</option>
            <option value="logged_out">Solo non loggati</option>
            <option value="logged_in">Solo utenti loggati</option>
            <option value="no_subscription">Loggati senza abbonamento Pro</option>
          </select>
        </div>
      </div>

      {/* Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Inizia il (opzionale)</label>
          <input
            type="datetime-local"
            className={fieldClass}
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Scade il (opzionale)</label>
          <input
            type="datetime-local"
            className={fieldClass}
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
      </div>

      {/* Popup-only settings */}
      {type === 'popup' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-surface-2/50 border border-border-subtle">
          <div>
            <label className={labelClass}>Ritardo comparsa (secondi)</label>
            <input
              type="number"
              min={0}
              max={60}
              className={fieldClass}
              value={popupDelay}
              onChange={(e) => setPopupDelay(Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelClass}>Frequenza</label>
            <select className={fieldClass} value={popupFreq} onChange={(e) => setPopupFreq(e.target.value as PromoFrequency)}>
              <option value="once">Una volta (per browser)</option>
              <option value="per_session">Ogni sessione</option>
              <option value="always">Sempre</option>
            </select>
          </div>
        </div>
      )}

      {error && (
        <p className="text-[0.78rem] text-accent-rose">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-accent-amber/15 text-accent-amber text-[0.82rem] font-semibold rounded-md border border-accent-amber/25 hover:bg-accent-amber/25 transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvataggio…' : isEdit ? 'Salva modifiche' : 'Crea promozione'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-[0.82rem] text-text-secondary hover:text-text-primary transition-colors"
        >
          Annulla
        </button>
      </div>
    </form>
  );
}
