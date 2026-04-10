'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { PromotionForm } from './PromotionForm';
import type { PathDiscount } from '@/types';

type RawDiscount = PathDiscount & {
  learning_paths?: { id: string; title: string } | null;
};

function discountStatus(d: PathDiscount): { label: string; cls: string } {
  const now = new Date();
  if (!d.is_active) return { label: 'Disattivo', cls: 'bg-surface-3 text-text-muted' };
  const start = new Date(d.starts_at);
  const end   = new Date(d.ends_at);
  if (start > now) return { label: 'Programmato', cls: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/20' };
  if (end < now)   return { label: 'Scaduto',     cls: 'bg-accent-rose/10 text-accent-rose border border-accent-rose/20' };
  return { label: 'Attivo', cls: 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20' };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function PromotionTable() {
  const [discounts, setDiscounts] = useState<RawDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RawDiscount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RawDiscount | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/path-discounts');
      if (res.ok) {
        const data = await res.json() as { discounts: RawDiscount[] };
        setDiscounts(data.discounts ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(d: RawDiscount) {
    setTogglingId(d.id);
    try {
      await fetch(`/api/admin/path-discounts/${d.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !d.is_active }),
      });
      setDiscounts((prev) => prev.map((x) => x.id === d.id ? { ...x, is_active: !x.is_active } : x));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/path-discounts/${deleteTarget.id}`, { method: 'DELETE' });
      setDiscounts((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function handleSaved(saved: RawDiscount) {
    setDiscounts((prev) => {
      const idx = prev.findIndex((x) => x.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setShowForm(false);
    setEditing(null);
  }

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-[0.82rem] text-text-muted">
          {discounts.length === 0 ? 'Nessuno sconto configurato.' : `${discounts.length} ${discounts.length === 1 ? 'sconto' : 'sconti'}`}
        </p>
        <button
          type="button"
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[0.82rem] font-semibold bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuovo sconto
        </button>
      </div>

      {/* Form */}
      {(showForm || editing) && (
        <div className="mb-6 p-5 rounded-xl border border-border-subtle bg-surface-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[0.88rem] font-semibold text-text-primary">
              {editing ? 'Modifica sconto' : 'Nuovo sconto'}
            </h3>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <PromotionForm
            initial={editing ?? undefined}
            onSaved={handleSaved}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin text-accent-cyan" width="22" height="22" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : discounts.length === 0 && !showForm ? (
        <div className="text-center py-16 text-text-muted text-[0.85rem]">
          Nessuno sconto configurato. Crea il primo cliccando "Nuovo sconto".
        </div>
      ) : (
        <div className="space-y-3">
          {discounts.map((d) => {
            const status = discountStatus(d);
            return (
              <div
                key={d.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border-subtle bg-surface-1 hover:border-white/10 transition-colors"
              >
                {/* Discount pct badge */}
                <div className="w-12 h-12 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[1rem] font-extrabold text-accent-amber leading-none">-{d.discount_pct}%</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[0.88rem] font-semibold text-text-primary">{d.name}</span>
                    <span className={cn('text-[0.65rem] font-semibold px-2 py-0.5 rounded-full', status.cls)}>
                      {status.label}
                    </span>
                    <span className={cn(
                      'text-[0.65rem] px-2 py-0.5 rounded-full font-medium',
                      d.scope === 'all'
                        ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'
                        : 'bg-surface-3 text-text-muted',
                    )}>
                      {d.scope === 'all' ? 'Tutti i percorsi' : d.learning_paths?.title ?? 'Percorso specifico'}
                    </span>
                  </div>
                  {d.description && (
                    <p className="text-[0.75rem] text-text-muted mt-0.5 truncate">{d.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[0.72rem] text-text-muted">
                    <span>{formatDate(d.starts_at)} → {formatDate(d.ends_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Toggle active */}
                  <button
                    type="button"
                    onClick={() => toggleActive(d)}
                    disabled={togglingId === d.id}
                    title={d.is_active ? 'Disattiva' : 'Attiva'}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-[0.75rem]',
                      d.is_active
                        ? 'bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20 border border-accent-emerald/20'
                        : 'bg-surface-3 text-text-muted hover:bg-surface-2 border border-border-subtle',
                    )}
                  >
                    {togglingId === d.id ? (
                      <svg className="animate-spin" width="12" height="12" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        {d.is_active
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        }
                      </svg>
                    )}
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => { setEditing(d); setShowForm(false); }}
                    title="Modifica"
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-3 text-text-muted hover:text-text-primary hover:bg-surface-2 border border-border-subtle transition-colors"
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(d)}
                    title="Elimina"
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-3 text-text-muted hover:text-accent-rose hover:bg-accent-rose/10 border border-border-subtle transition-colors"
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Elimina sconto"
        message={`Eliminare lo sconto "${deleteTarget?.name}"? L'operazione è irreversibile.`}
        confirmLabel="Elimina"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
