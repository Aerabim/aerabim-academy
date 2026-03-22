'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { RequestSessionForm } from '@/components/live/RequestSessionForm';
import type { SessionRequestDisplay, SessionRequestStatus } from '@/types';
import Link from 'next/link';

const STATUS_CONFIG: Record<SessionRequestStatus, { label: string; color: string }> = {
  pending: { label: 'In attesa', color: 'text-accent-amber' },
  confirmed: { label: 'Confermata', color: 'text-accent-cyan' },
  proposed: { label: 'Proposta alternativa', color: 'text-accent-violet' },
  declined: { label: 'Non disponibile', color: 'text-accent-rose' },
  canceled: { label: 'Annullata', color: 'text-text-muted' },
};

const SLOT_LABELS: Record<string, string> = {
  mattina: 'Mattina',
  pomeriggio: 'Pomeriggio',
  sera: 'Sera',
};

interface RequestSessionPageProps {
  initialRequests: SessionRequestDisplay[];
}

export function RequestSessionPage({ initialRequests }: RequestSessionPageProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(initialRequests.length === 0);

  function handleSuccess() {
    setShowForm(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Form — full width on top when visible */}
      {showForm && (
        <Card topBorder="cyan">
          <div className="px-5 py-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-[0.95rem] font-bold text-text-primary">
                Nuova richiesta
              </h2>
              {initialRequests.length > 0 && (
                <button
                  onClick={() => setShowForm(false)}
                  className="text-[0.72rem] text-text-muted hover:text-text-primary transition-colors"
                >
                  Chiudi
                </button>
              )}
            </div>
            <RequestSessionForm onSuccess={handleSuccess} />
          </div>
        </Card>
      )}

      {/* Existing requests — full width */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-[0.95rem] font-bold text-text-primary">
            Le tue richieste
          </h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-[0.78rem] font-semibold text-accent-cyan hover:brightness-110 transition-colors"
            >
              + Nuova richiesta
            </button>
          )}
        </div>

        {initialRequests.length === 0 && !showForm ? (
          <Card>
            <div className="px-5 py-8 text-center">
              <p className="text-[0.82rem] text-text-muted">Nessuna richiesta inviata.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-[0.78rem] font-semibold text-accent-cyan hover:underline"
              >
                Invia la tua prima richiesta
              </button>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {initialRequests.map((req) => {
              const statusConfig = STATUS_CONFIG[req.status];
              const weekDate = new Date(req.preferredWeek);
              const weekFormatted = weekDate.toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <Card key={req.id}>
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[0.85rem] font-semibold text-text-primary">
                          {req.topic}
                        </div>
                        <div className="text-[0.72rem] text-text-muted mt-0.5">
                          Settimana del {weekFormatted} · {SLOT_LABELS[req.preferredSlot] || req.preferredSlot}
                        </div>
                        {req.description && (
                          <div className="text-[0.75rem] text-text-secondary mt-2 line-clamp-2">
                            {req.description}
                          </div>
                        )}
                      </div>
                      <span className={`shrink-0 text-[0.68rem] font-bold uppercase tracking-wider ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Admin note */}
                    {req.adminNote && (
                      <div className="mt-3 bg-surface-2 rounded-sm px-3 py-2.5 border border-border-subtle">
                        <div className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1">
                          Risposta
                        </div>
                        <div className="text-[0.78rem] text-text-secondary">
                          {req.adminNote}
                        </div>
                      </div>
                    )}

                    {/* Action for confirmed */}
                    {req.status === 'confirmed' && req.sessionId && (
                      <Link
                        href={`/sessioni-live/${req.sessionId}`}
                        className="inline-block mt-3 text-[0.75rem] font-semibold text-accent-cyan hover:underline"
                      >
                        Vai alla sessione &rarr;
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
