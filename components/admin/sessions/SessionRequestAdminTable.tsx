'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { timeAgo } from '@/lib/utils';

interface RequestItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  topic: string;
  preferredWeek: string;
  preferredSlot: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

interface Props {
  requests: RequestItem[];
}

const STATUS_BADGES: Record<string, { label: string; variant: 'amber' | 'cyan' | 'emerald' | 'rose' }> = {
  pending: { label: 'In attesa', variant: 'amber' },
  proposed: { label: 'Proposta', variant: 'cyan' },
  confirmed: { label: 'Confermata', variant: 'emerald' },
  declined: { label: 'Rifiutata', variant: 'rose' },
};

export function SessionRequestAdminTable({ requests: initial }: Props) {
  const router = useRouter();
  const [requests, setRequests] = useState(initial);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('confirmed');
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleRespond(requestId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/session-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, adminNote: adminNote || undefined }),
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => r.id === requestId ? { ...r, status: newStatus, adminNote } : r),
        );
        setRespondingId(null);
        setAdminNote('');
      }
    } catch (err) {
      console.error('Respond error:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {requests.length === 0 ? (
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-6 text-center text-[0.82rem] text-text-muted">
          Nessuna richiesta.
        </div>
      ) : (
        requests.map((r) => {
          const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES.pending;
          return (
            <div key={r.id} className="bg-surface-1 border border-border-subtle rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[0.85rem] font-medium text-text-primary">{r.topic}</div>
                  <div className="text-[0.72rem] text-text-muted mt-0.5">
                    {r.userName} ({r.userEmail}) &middot; {timeAgo(r.createdAt)}
                  </div>
                  <div className="text-[0.72rem] text-text-muted">
                    Settimana: {r.preferredWeek} &middot; Fascia: {r.preferredSlot}
                  </div>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>

              {r.adminNote && (
                <div className="text-[0.78rem] text-text-secondary bg-surface-2/30 px-3 py-2 rounded">
                  <span className="text-[0.68rem] text-text-muted uppercase font-bold">Nota admin:</span> {r.adminNote}
                </div>
              )}

              {r.status === 'pending' && (
                <>
                  {respondingId === r.id ? (
                    <div className="space-y-2 pt-2 border-t border-border-subtle">
                      <div className="flex items-center gap-2">
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="px-3 py-1.5 bg-surface-2 border border-border-subtle rounded text-[0.78rem] text-text-primary focus:outline-none focus:border-accent-cyan/50"
                        >
                          <option value="confirmed">Confermata</option>
                          <option value="proposed">Proposta alternativa</option>
                          <option value="declined">Rifiutata</option>
                        </select>
                      </div>
                      <textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Nota per l'utente (opzionale)..."
                        rows={2}
                        className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded text-[0.78rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 resize-y"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespond(r.id)}
                          disabled={saving}
                          className="px-3 py-1.5 bg-accent-cyan/15 text-accent-cyan text-[0.78rem] font-semibold rounded border border-accent-cyan/20 hover:bg-accent-cyan/25 disabled:opacity-50"
                        >
                          {saving ? '...' : 'Invia risposta'}
                        </button>
                        <button
                          onClick={() => setRespondingId(null)}
                          className="px-3 py-1.5 text-[0.78rem] text-text-muted hover:text-text-primary"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRespondingId(r.id)}
                      className="text-[0.78rem] text-accent-cyan hover:underline"
                    >
                      Rispondi
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
