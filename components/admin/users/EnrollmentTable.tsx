'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { timeAgo } from '@/lib/utils';
import type { AdminEnrollmentItem } from '@/types';

export function EnrollmentTable() {
  const [enrollments, setEnrollments] = useState<AdminEnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokeTarget, setRevokeTarget] = useState<AdminEnrollmentItem | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  async function fetchEnrollments() {
    try {
      const res = await fetch('/api/admin/enrollments');
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments ?? []);
      }
    } catch (err) {
      console.error('Fetch enrollments error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/admin/enrollments/${revokeTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revoke: true }),
      });
      if (res.ok) {
        setEnrollments((prev) =>
          prev.map((e) =>
            e.id === revokeTarget.id
              ? { ...e, expiresAt: new Date().toISOString() }
              : e,
          ),
        );
      }
    } catch (err) {
      console.error('Revoke error:', err);
    } finally {
      setRevoking(false);
      setRevokeTarget(null);
    }
  }

  function isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  return (
    <>
      <div className="overflow-x-auto border border-border-subtle rounded-lg">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-2/50">
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Utente</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Corso</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Tipo</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Stato</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Data</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[0.82rem] text-text-muted">Caricamento...</td></tr>
            ) : enrollments.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[0.82rem] text-text-muted">Nessuna iscrizione.</td></tr>
            ) : (
              enrollments.map((e) => {
                const expired = isExpired(e.expiresAt);
                return (
                  <tr key={e.id} className="border-b border-border-subtle last:border-b-0 hover:bg-surface-2/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-[0.82rem] text-text-primary font-medium">{e.userName}</div>
                      <div className="text-[0.7rem] text-text-muted">{e.userEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] text-text-secondary">{e.courseTitle}</td>
                    <td className="px-4 py-3">
                      <Badge variant={e.accessType === 'pro_subscription' ? 'cyan' : e.accessType === 'free' ? 'emerald' : 'amber'}>
                        {e.accessType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {expired ? (
                        <span className="text-[0.72rem] text-accent-rose font-medium">Scaduto</span>
                      ) : (
                        <span className="text-[0.72rem] text-accent-emerald font-medium">Attivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[0.78rem] text-text-muted">{timeAgo(e.createdAt)}</td>
                    <td className="px-4 py-3">
                      {!expired && (
                        <button
                          onClick={() => setRevokeTarget(e)}
                          className="text-[0.78rem] text-accent-rose hover:underline"
                        >
                          Revoca
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!revokeTarget}
        title="Revoca iscrizione"
        message={`Revocare l'accesso di ${revokeTarget?.userName} al corso "${revokeTarget?.courseTitle}"?`}
        confirmLabel="Revoca"
        variant="danger"
        loading={revoking}
        onConfirm={handleRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </>
  );
}
