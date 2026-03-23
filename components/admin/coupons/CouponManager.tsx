'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { CouponForm } from './CouponForm';
import type { AdminCouponListItem } from '@/types';

export function CouponManager() {
  const [coupons, setCoupons] = useState<AdminCouponListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCouponListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons ?? []);
      }
    } catch (err) {
      console.error('Load coupons error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(coupon: AdminCouponListItem) {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !coupon.active }),
      });
      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) => c.id === coupon.id ? { ...c, active: !c.active } : c),
        );
      }
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/coupons/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stripeCouponId: deleteTarget.couponId }),
      });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      }
    } catch (err) {
      console.error('Delete coupon error:', err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  function formatDiscount(c: AdminCouponListItem): string {
    if (c.percentOff) return `${c.percentOff}%`;
    if (c.amountOff) return `${(c.amountOff / 100).toFixed(2).replace('.', ',')} €`;
    return '-';
  }

  function formatDuration(c: AdminCouponListItem): string {
    if (c.duration === 'once') return 'Una volta';
    if (c.duration === 'forever') return 'Per sempre';
    return `${c.durationInMonths ?? '?'} mesi`;
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-[0.82rem] text-text-secondary">
          {coupons.length} coupon{coupons.length !== 1 ? '' : ''}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-accent-cyan/15 text-accent-cyan text-[0.8rem] font-semibold rounded-md border border-accent-cyan/20 hover:bg-accent-cyan/25 transition-colors"
          >
            + Nuovo coupon
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-6">
          <CouponForm
            onCreated={() => { setShowForm(false); loadCoupons(); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center text-[0.82rem] text-text-muted py-10">Caricamento...</div>
      ) : (
        <div className="overflow-x-auto border border-border-subtle rounded-lg">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-2/50">
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Codice</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Sconto</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Durata</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Utilizzi</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Scadenza</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Stato</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[0.82rem] text-text-muted">
                    Nessun coupon creato.
                  </td>
                </tr>
              ) : coupons.map((c) => (
                <tr key={c.id} className="border-b border-border-subtle last:border-b-0 hover:bg-surface-2/30 transition-colors">
                  <td className="px-4 py-3 text-[0.82rem] font-medium text-text-primary font-mono">{c.code}</td>
                  <td className="px-4 py-3 text-[0.82rem] text-text-secondary">{formatDiscount(c)}</td>
                  <td className="px-4 py-3 text-[0.82rem] text-text-secondary">{formatDuration(c)}</td>
                  <td className="px-4 py-3 text-[0.82rem] text-text-secondary">
                    {c.timesRedeemed}{c.maxRedemptions ? ` / ${c.maxRedemptions}` : ''}
                  </td>
                  <td className="px-4 py-3 text-[0.82rem] text-text-muted">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('it-IT') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(c)}
                      className={cn(
                        'text-[0.72rem] font-semibold px-2.5 py-1 rounded-md transition-colors',
                        c.active
                          ? 'bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20'
                          : 'bg-surface-3 text-text-muted hover:text-text-secondary',
                      )}
                    >
                      {c.active ? 'Attivo' : 'Disattivato'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="text-[0.78rem] text-accent-rose hover:underline"
                    >
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Elimina coupon"
        message={`Eliminare il coupon "${deleteTarget?.code}"? Questa azione è irreversibile.`}
        confirmLabel="Elimina"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
