'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface SessionItem {
  id: string;
  type: string;
  title: string;
  hostName: string;
  scheduledAt: string;
  status: string;
  isPublished: boolean;
  bookingCount: number;
}

interface SessionAdminTableProps {
  sessions: SessionItem[];
}

export function SessionAdminTable({ sessions: initialSessions }: SessionAdminTableProps) {
  const [sessions, setSessions] = useState(initialSessions);

  async function handleTogglePublish(session: SessionItem) {
    try {
      const res = await fetch(`/api/admin/live-sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !session.isPublished }),
      });
      if (res.ok) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === session.id ? { ...s, isPublished: !s.isPublished } : s,
          ),
        );
      }
    } catch (err) {
      console.error('Toggle publish error:', err);
    }
  }

  return (
    <div className="overflow-x-auto border border-border-subtle rounded-lg">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-2/50">
            <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Titolo</th>
            <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Tipo</th>
            <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Data</th>
            <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Prenotazioni</th>
            <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Stato</th>
            <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-[0.82rem] text-text-muted">Nessuna sessione.</td></tr>
          ) : (
            sessions.map((s) => (
              <tr key={s.id} className="border-b border-border-subtle last:border-b-0 hover:bg-surface-2/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-[0.82rem] font-medium text-text-primary">{s.title}</div>
                  <div className="text-[0.7rem] text-text-muted">{s.hostName}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={s.type === 'webinar' ? 'cyan' : 'amber'}>
                    {s.type === 'webinar' ? 'Webinar' : 'Mentoring'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[0.82rem] text-text-secondary">
                  {new Date(s.scheduledAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 text-[0.82rem] text-text-secondary">{s.bookingCount}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleTogglePublish(s)}
                    className={cn(
                      'text-[0.72rem] font-semibold px-2.5 py-1 rounded-md transition-colors',
                      s.isPublished
                        ? 'bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20'
                        : 'bg-surface-3 text-text-muted hover:text-text-secondary',
                    )}
                  >
                    {s.isPublished ? 'Pubblicata' : 'Bozza'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/sessioni-live/${s.id}`} className="text-[0.78rem] text-accent-cyan hover:underline">
                    Dettaglio
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
