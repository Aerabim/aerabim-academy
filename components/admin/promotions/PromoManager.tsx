'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { PromoForm } from './PromoForm';
import type { Promotion, PromoTheme } from '@/types';

const THEME_DOT: Record<PromoTheme, string> = {
  amber: 'bg-accent-amber',
  cyan:  'bg-accent-cyan',
  red:   'bg-accent-rose',
  green: 'bg-accent-emerald',
};

function promoStatus(p: Promotion): { label: string; cls: string } {
  const now = new Date();
  if (!p.is_active) return { label: 'Disattiva', cls: 'bg-surface-3 text-text-muted' };
  const start = p.starts_at ? new Date(p.starts_at) : null;
  const end   = p.ends_at   ? new Date(p.ends_at)   : null;
  if (start && start > now) return { label: 'Programmata', cls: 'bg-accent-amber/10 text-accent-amber' };
  if (end   && end   < now) return { label: 'Scaduta',     cls: 'bg-accent-rose/10 text-accent-rose' };
  return { label: 'Attiva', cls: 'bg-accent-emerald/10 text-accent-emerald' };
}

export function PromoManager() {
  const [promos, setPromos]           = useState<Promotion[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState<Promotion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [deleting, setDeleting]       = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promotions');
      if (res.ok) {
        const data = await res.json() as { promotions: Promotion[] };
        setPromos(data.promotions ?? []);
      }
    } catch (err) {
      console.error('Load promotions error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(p: Promotion) {
    try {
      const res = await fetch(`/api/admin/promotions/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !p.is_active }),
      });
      if (res.ok) {
        setPromos((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !p.is_active } : x));
      }
    } catch (err) {
      console.error('Toggle promo error:', err);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/promotions/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) setPromos((prev) => prev.filter((x) => x.id !== deleteTarget.id));
    } catch (err) {
      console.error('Delete promo error:', err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  function onSaved(saved: Promotion) {
    if (editing) {
      setPromos((prev) => prev.map((x) => x.id === saved.id ? saved : x));
      setEditing(null);
    } else {
      setPromos((prev) => [saved, ...prev]);
      setShowForm(false);
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[0.82rem] text-text-secondary">
          {promos.length} promozione{promos.length !== 1 ? 'i' : ''}
        </p>
        {!showForm && !editing && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-accent-amber/15 text-accent-amber text-[0.8rem] font-semibold rounded-md border border-accent-amber/20 hover:bg-accent-amber/25 transition-colors"
          >
            + Nuova promozione
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && !editing && (
        <div className="mb-6">
          <PromoForm onSaved={onSaved} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="mb-6">
          <PromoForm initial={editing} onSaved={onSaved} onCancel={() => setEditing(null)} />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center text-[0.82rem] text-text-muted py-10">Caricamento…</div>
      ) : (
        <div className="overflow-x-auto border border-border-subtle rounded-lg">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-2/50">
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Nome</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Tipo</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Titolo pubblico</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Tema</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Date</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Stato</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {promos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[0.82rem] text-text-muted">
                    Nessuna promozione creata.
                  </td>
                </tr>
              ) : promos.map((p) => {
                const status = promoStatus(p);
                return (
                  <tr key={p.id} className="border-b border-border-subtle last:border-b-0 hover:bg-surface-2/30 transition-colors">
                    <td className="px-4 py-3 text-[0.82rem] font-medium text-text-primary max-w-[140px] truncate">{p.name}</td>
                    <td className="px-4 py-3 text-[0.78rem] text-text-secondary capitalize">{p.type}</td>
                    <td className="px-4 py-3 text-[0.78rem] text-text-secondary max-w-[180px] truncate">{p.title}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('w-2 h-2 rounded-full', THEME_DOT[p.theme])} />
                        <span className="text-[0.78rem] text-text-secondary capitalize">{p.theme}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[0.75rem] text-text-muted whitespace-nowrap">
                      {p.starts_at
                        ? new Date(p.starts_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
                        : '—'
                      }
                      {' → '}
                      {p.ends_at
                        ? new Date(p.ends_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
                        : '∞'
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(p)}
                          title={p.is_active ? 'Clicca per disattivare' : 'Clicca per attivare'}
                          className={cn(
                            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                            'transition-colors duration-200 focus:outline-none',
                            p.is_active ? 'bg-accent-emerald/70' : 'bg-surface-3',
                          )}
                        >
                          <span
                            className={cn(
                              'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm',
                              'transform transition duration-200',
                              p.is_active ? 'translate-x-4' : 'translate-x-0',
                            )}
                          />
                        </button>
                        <span className={cn('text-[0.72rem] font-semibold', status.cls.split(' ').filter(c => c.startsWith('text-')).join(' '))}>
                          {status.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => { setEditing(p); setShowForm(false); }}
                          className="text-[0.78rem] text-text-secondary hover:text-text-primary transition-colors"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="text-[0.78rem] text-accent-rose hover:underline"
                        >
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Elimina promozione"
        message={`Eliminare la promozione "${deleteTarget?.name}"? Questa azione è irreversibile.`}
        confirmLabel="Elimina"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
