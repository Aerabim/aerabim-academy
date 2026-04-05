'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { SimulationRow } from '@/types';

const ACCENT_TIPO: Record<'scritto' | 'pratico', string> = {
  scritto: '#F0A500',
  pratico: '#4ECDC4',
};

interface SimulationTableProps {
  simulations: SimulationRow[];
}

export function SimulationTable({ simulations }: SimulationTableProps) {
  const [rows, setRows] = useState<SimulationRow[]>(simulations);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleComingSoon(sim: SimulationRow) {
    setSaving(sim.id);
    setError(null);
    const next = !sim.comingSoon;
    try {
      const res = await fetch(`/api/admin/simulations/${sim.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comingSoon: next }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Errore durante l\'aggiornamento.');
        return;
      }
      setRows((prev) => prev.map((r) => r.id === sim.id ? { ...r, comingSoon: next } : r));
    } catch {
      setError('Errore di rete.');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-[0.78rem] text-accent-rose bg-accent-rose/8 border border-accent-rose/20 rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border-subtle overflow-hidden">
        <table className="w-full text-[0.82rem]">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-1/50">
              <th className="text-left px-4 py-3 text-text-muted font-medium w-12">Img</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium">Figura / Tipo</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium hidden md:table-cell">Descrizione</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium w-24">Durata</th>
              <th className="text-center px-4 py-3 text-text-muted font-medium w-32">Disponibile</th>
              <th className="text-right px-4 py-3 text-text-muted font-medium w-20">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((sim, i) => {
              const accent = ACCENT_TIPO[sim.tipo];
              const isSaving = saving === sim.id;
              return (
                <tr
                  key={sim.id}
                  className={cn(
                    'border-b border-border-subtle last:border-0 transition-colors',
                    'hover:bg-surface-1/40',
                    i % 2 === 0 ? 'bg-surface-0' : 'bg-surface-1/20',
                  )}
                >
                  {/* Thumbnail */}
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-border-subtle bg-surface-2 shrink-0">
                      {sim.thumbnailUrl ? (
                        <img src={sim.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: `${accent}12` }}
                        >
                          <svg width="14" height="14" fill="none" stroke={accent} strokeWidth={1.5} viewBox="0 0 24 24" opacity={0.5}>
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Figura + tipo */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-medium text-text-primary truncate">{sim.figura}</span>
                      <span
                        className="inline-flex self-start items-center gap-1 px-2 py-0.5 rounded-full text-[0.62rem] font-bold uppercase tracking-wider border"
                        style={{ color: accent, background: `${accent}12`, borderColor: `${accent}30` }}
                      >
                        {sim.tipo === 'scritto' ? `Scritto · ${sim.domande ?? 30} dom.` : 'Pratico · Esercitazione'}
                      </span>
                    </div>
                  </td>

                  {/* Descrizione */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-text-secondary line-clamp-2 text-[0.78rem]">
                      {sim.descrizione ?? <span className="text-text-muted italic">Nessuna descrizione</span>}
                    </span>
                  </td>

                  {/* Durata */}
                  <td className="px-4 py-3 text-text-muted">
                    {sim.durataMin} min
                  </td>

                  {/* Toggle coming_soon */}
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => toggleComingSoon(sim)}
                        title={sim.comingSoon ? 'Attiva simulazione' : 'Metti in arrivo'}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
                          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-0',
                          isSaving && 'opacity-50 cursor-not-allowed',
                          !sim.comingSoon ? 'bg-accent-emerald/80 focus:ring-accent-emerald' : 'bg-surface-3 focus:ring-border-hover',
                        )}
                        aria-checked={!sim.comingSoon}
                        role="switch"
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                            !sim.comingSoon ? 'translate-x-6' : 'translate-x-1',
                          )}
                        />
                      </button>
                    </div>
                  </td>

                  {/* Azioni */}
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/simulazioni/${sim.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.74rem] font-medium text-text-secondary border border-border-subtle hover:border-border-hover hover:text-text-primary transition-colors"
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Modifica
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[0.7rem] text-text-muted">
        {rows.filter((r) => !r.comingSoon).length} di {rows.length} simulazioni attive
      </p>
    </div>
  );
}
