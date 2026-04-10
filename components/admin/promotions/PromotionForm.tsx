'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { PathDiscount } from '@/types';

interface PromotionFormProps {
  initial?: PathDiscount & { learning_paths?: { id: string; title: string } | null };
  onSaved: (discount: PathDiscount & { learning_paths?: { id: string; title: string } | null }) => void;
  onCancel: () => void;
}

interface PathOption { id: string; title: string }

export function PromotionForm({ initial, onSaved, onCancel }: PromotionFormProps) {
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [discountPct, setDiscountPct] = useState(initial?.discount_pct?.toString() ?? '');
  const [scope, setScope] = useState<'all' | 'path'>(initial?.scope ?? 'all');
  const [pathId, setPathId] = useState(initial?.path_id ?? '');
  const [startsAt, setStartsAt] = useState(initial?.starts_at ? initial.starts_at.slice(0, 16) : '');
  const [endsAt, setEndsAt] = useState(initial?.ends_at ? initial.ends_at.slice(0, 16) : '');
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [paths, setPaths] = useState<PathOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/learning-paths')
      .then((r) => r.json())
      .then((data: { paths?: PathOption[] }) => setPaths(data.paths ?? []))
      .catch(() => undefined);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        discountPct: parseInt(discountPct, 10),
        scope,
        pathId: scope === 'path' ? pathId : undefined,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        isActive,
      };

      const url = isEdit
        ? `/api/admin/path-discounts/${initial.id}`
        : '/api/admin/path-discounts';

      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json() as { discount?: PathDiscount & { learning_paths?: { id: string; title: string } | null }; error?: string };

      if (!res.ok || !json.discount) {
        setError(json.error ?? 'Errore durante il salvataggio.');
        return;
      }

      onSaved(json.discount);
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-4 py-2.5 rounded-md bg-accent-rose/10 border border-accent-rose/20 text-[0.82rem] text-accent-rose">
          {error}
        </div>
      )}

      {/* Name + Discount pct */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-1.5">
          <label className="text-[0.78rem] font-medium text-text-secondary">
            Nome <span className="text-accent-rose">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="es. Black Friday 2026"
            className="w-full px-3 py-2 text-[0.83rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[0.78rem] font-medium text-text-secondary">
            Sconto (%) <span className="text-accent-rose">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={100}
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
              placeholder="es. 40"
              className="w-full px-3 py-2 pr-8 text-[0.83rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-amber/50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.75rem] text-text-muted">%</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-[0.78rem] font-medium text-text-secondary">Descrizione interna</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Note interne sulla promozione"
          className="w-full px-3 py-2 text-[0.83rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
        />
      </div>

      {/* Scope */}
      <div className="space-y-1.5">
        <label className="text-[0.78rem] font-medium text-text-secondary">Applicazione</label>
        <div className="flex gap-3">
          {(['all', 'path'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={cn(
                'flex-1 py-2 rounded-lg text-[0.82rem] font-medium border transition-colors',
                scope === s
                  ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
                  : 'bg-surface-2 text-text-secondary border-border-subtle hover:border-white/15',
              )}
            >
              {s === 'all' ? 'Tutti i percorsi' : 'Percorso specifico'}
            </button>
          ))}
        </div>
      </div>

      {/* Path selector (only if scope=path) */}
      {scope === 'path' && (
        <div className="space-y-1.5">
          <label className="text-[0.78rem] font-medium text-text-secondary">
            Percorso <span className="text-accent-rose">*</span>
          </label>
          <select
            value={pathId}
            onChange={(e) => setPathId(e.target.value)}
            className="w-full px-3 py-2 text-[0.83rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary focus:outline-none focus:border-accent-cyan/50"
          >
            <option value="">— Seleziona percorso —</option>
            {paths.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Date range */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[0.78rem] font-medium text-text-secondary">
            Inizio <span className="text-accent-rose">*</span>
          </label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full px-3 py-2 text-[0.83rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary focus:outline-none focus:border-accent-cyan/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[0.78rem] font-medium text-text-secondary">
            Fine <span className="text-accent-rose">*</span>
          </label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full px-3 py-2 text-[0.83rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary focus:outline-none focus:border-accent-cyan/50"
          />
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsActive((v) => !v)}
          className={cn(
            'relative w-10 h-6 rounded-full transition-colors',
            isActive ? 'bg-accent-emerald' : 'bg-surface-3',
          )}
        >
          <span className={cn(
            'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
            isActive ? 'translate-x-5' : 'translate-x-1',
          )} />
        </button>
        <span className="text-[0.82rem] text-text-secondary">
          {isActive ? 'Attivo' : 'Disattivo'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 text-[0.83rem] font-semibold rounded-md bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvataggio…' : isEdit ? 'Salva modifiche' : 'Crea sconto'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 text-[0.83rem] font-semibold rounded-md bg-surface-2 text-text-secondary hover:text-text-primary border border-border-subtle transition-colors"
        >
          Annulla
        </button>
      </div>
    </form>
  );
}
