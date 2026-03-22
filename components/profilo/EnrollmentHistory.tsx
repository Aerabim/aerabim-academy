'use client';

import { useState } from 'react';
import type { AreaCode } from '@/types';

interface EnrollmentItem {
  id: string;
  courseTitle: string;
  area: AreaCode;
  accessType: string;
  createdAt: string;
  expiresAt: string | null;
}

const REFUND_WINDOW_DAYS = 14;

const areaLabels: Record<AreaCode, string> = {
  OB: 'Obblighi BIM',
  SW: 'Software',
  NL: 'Normativa',
  PG: 'Project & Gestione',
  AI: 'AI & Innovazione',
};

const accessTypeLabels: Record<string, string> = {
  single: 'Acquisto singolo',
  pro_subscription: 'Abbonamento Pro',
  team: 'Team',
  free: 'Gratuito',
};

function isRefundEligible(enrollment: EnrollmentItem): boolean {
  if (enrollment.accessType !== 'single') return false;
  const daysSince = Math.floor(
    (Date.now() - new Date(enrollment.createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  return daysSince <= REFUND_WINDOW_DAYS;
}

export function EnrollmentHistory({ enrollments }: { enrollments: EnrollmentItem[] }) {
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundedIds, setRefundedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function handleRefund(enrollmentId: string) {
    if (!confirm('Sei sicuro di voler richiedere il rimborso? L\'accesso al corso verrà rimosso immediatamente.')) {
      return;
    }

    setRefundingId(enrollmentId);
    setError(null);

    try {
      const res = await fetch('/api/refund/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId }),
      });

      if (!res.ok) {
        const data = await res.json() as { error: string };
        setError(data.error || 'Errore durante la richiesta di rimborso.');
        return;
      }

      setRefundedIds((prev) => new Set(prev).add(enrollmentId));
    } catch {
      setError('Errore di connessione. Riprova.');
    } finally {
      setRefundingId(null);
    }
  }

  if (enrollments.length === 0) {
    return (
      <div className="rounded-xl border border-brand-blue/20 bg-gradient-to-br from-brand-blue/10 to-brand-dark/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Storico corsi</h2>
        <p className="text-sm text-brand-gray">
          Non hai ancora acquistato nessun corso. Esplora il{' '}
          <a href="/catalogo-corsi" className="text-cyan-400 hover:underline">catalogo</a>{' '}
          per iniziare.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand-blue/20 bg-gradient-to-br from-brand-blue/10 to-brand-dark/50 p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Storico corsi</h2>

      {error && (
        <p className="mb-4 text-sm text-rose-400">{error}</p>
      )}

      {/* Desktop: table layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-blue/20 text-left text-brand-light">
              <th className="pb-3 pr-4 font-medium">Corso</th>
              <th className="pb-3 pr-4 font-medium">Area</th>
              <th className="pb-3 pr-4 font-medium">Tipo accesso</th>
              <th className="pb-3 pr-4 font-medium">Data acquisto</th>
              <th className="pb-3 pr-4 font-medium">Scadenza</th>
              <th className="pb-3 font-medium">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-blue/10">
            {enrollments.map((enrollment) => {
              const isExpired = enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date();
              const canRefund = isRefundEligible(enrollment) && !refundedIds.has(enrollment.id);
              const wasRefunded = refundedIds.has(enrollment.id);

              return (
                <tr key={enrollment.id} className="text-brand-gray">
                  <td className="py-3 pr-4 text-white font-medium">{enrollment.courseTitle}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex rounded-full bg-brand-blue/20 px-2.5 py-0.5 text-xs text-brand-light">
                      {areaLabels[enrollment.area] ?? enrollment.area}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{accessTypeLabels[enrollment.accessType] ?? enrollment.accessType}</td>
                  <td className="py-3 pr-4">
                    {new Date(enrollment.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 pr-4">
                    {enrollment.expiresAt ? (
                      <span className={isExpired ? 'text-rose-400' : ''}>
                        {new Date(enrollment.expiresAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {isExpired && ' (scaduto)'}
                      </span>
                    ) : (
                      <span className="text-emerald-400">Illimitato</span>
                    )}
                  </td>
                  <td className="py-3">
                    {wasRefunded ? (
                      <span className="text-sm text-amber-400">Rimborsato</span>
                    ) : canRefund ? (
                      <button
                        onClick={() => handleRefund(enrollment.id)}
                        disabled={refundingId === enrollment.id}
                        className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {refundingId === enrollment.id ? 'Rimborso...' : 'Rimborsa'}
                      </button>
                    ) : (
                      <span className="text-xs text-brand-gray/50">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: card layout */}
      <div className="md:hidden space-y-3">
        {enrollments.map((enrollment) => {
          const isExpired = enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date();
          const canRefund = isRefundEligible(enrollment) && !refundedIds.has(enrollment.id);
          const wasRefunded = refundedIds.has(enrollment.id);

          return (
            <div key={enrollment.id} className="rounded-lg border border-brand-blue/15 bg-brand-dark/30 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-white font-medium leading-tight">{enrollment.courseTitle}</p>
                <span className="shrink-0 inline-flex rounded-full bg-brand-blue/20 px-2 py-0.5 text-[0.65rem] text-brand-light">
                  {areaLabels[enrollment.area] ?? enrollment.area}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-gray">
                <span>{accessTypeLabels[enrollment.accessType] ?? enrollment.accessType}</span>
                <span>{new Date(enrollment.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {enrollment.expiresAt ? (
                  <span className={isExpired ? 'text-rose-400' : ''}>
                    Scade: {new Date(enrollment.expiresAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {isExpired && ' (scaduto)'}
                  </span>
                ) : (
                  <span className="text-emerald-400">Illimitato</span>
                )}
              </div>
              {wasRefunded ? (
                <p className="text-sm text-amber-400">Rimborsato</p>
              ) : canRefund ? (
                <button
                  onClick={() => handleRefund(enrollment.id)}
                  disabled={refundingId === enrollment.id}
                  className="mt-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {refundingId === enrollment.id ? 'Rimborso...' : 'Richiedi rimborso'}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-brand-gray/70">
        Il rimborso è disponibile entro 14 giorni dall&apos;acquisto per i corsi acquistati singolarmente (diritto di recesso UE).
      </p>
    </div>
  );
}
