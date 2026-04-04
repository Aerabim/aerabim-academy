'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { LEVEL_LABELS } from '@/lib/area-config';
import type { AdminLearningPathListItem, LevelCode } from '@/types';

interface LearningPathTableProps {
  paths: AdminLearningPathListItem[];
}

export function LearningPathTable({ paths: initialPaths }: LearningPathTableProps) {
  const router = useRouter();
  const [paths, setPaths] = useState(initialPaths);
  const [filter, setFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminLearningPathListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = paths.filter((p) =>
    p.title.toLowerCase().includes(filter.toLowerCase()) ||
    (p.targetRole ?? '').toLowerCase().includes(filter.toLowerCase()),
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/learning-paths/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setPaths((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        const json = await res.json() as { error?: string };
        alert(json.error ?? 'Errore durante l\'eliminazione.');
      }
    } catch {
      alert('Errore di rete.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-5">
        <input
          type="text"
          placeholder="Cerca percorso o ruolo..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-xs px-3 py-2 text-[0.82rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
        />
        <Link
          href="/admin/learning-paths/nuovo"
          className="shrink-0 px-4 py-2 text-[0.82rem] font-semibold rounded-md bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors"
        >
          + Nuovo percorso
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-text-muted text-[0.85rem]">
          {paths.length === 0 ? 'Nessun percorso creato.' : 'Nessun risultato.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-subtle">
          <table className="w-full text-[0.82rem]">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-2">
                <th className="text-left px-4 py-3 text-text-muted font-semibold">Percorso</th>
                <th className="text-left px-4 py-3 text-text-muted font-semibold">Ruolo target</th>
                <th className="text-left px-4 py-3 text-text-muted font-semibold">Livello</th>
                <th className="text-center px-4 py-3 text-text-muted font-semibold">Passi</th>
                <th className="text-center px-4 py-3 text-text-muted font-semibold">Corsi</th>
                <th className="text-left px-4 py-3 text-text-muted font-semibold">Stato</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((path) => (
                <tr
                  key={path.id}
                  className="border-b border-border-subtle/50 hover:bg-surface-2/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-primary">{path.title}</div>
                    {path.estimatedHours && (
                      <div className="text-text-muted text-[0.72rem] mt-0.5">~{path.estimatedHours}h</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {path.targetRole ?? <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {path.level ? (
                      <span className="px-2 py-0.5 rounded text-[0.7rem] font-semibold bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                        {LEVEL_LABELS[path.level as LevelCode]}
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-text-secondary">{path.stepCount}</td>
                  <td className="px-4 py-3 text-center text-text-secondary">{path.courseCount}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[0.7rem] font-semibold border',
                      path.isPublished
                        ? 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20'
                        : 'bg-surface-3 text-text-muted border-border-subtle',
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', path.isPublished ? 'bg-accent-emerald' : 'bg-text-muted')} />
                      {path.isPublished ? 'Pubblicato' : 'Bozza'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/learning-paths/${path.id}`}
                        className="px-3 py-1.5 text-[0.75rem] font-medium rounded-md bg-surface-2 border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
                      >
                        Modifica
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(path)}
                        className="px-3 py-1.5 text-[0.75rem] font-medium rounded-md bg-accent-rose/10 border border-accent-rose/20 text-accent-rose hover:bg-accent-rose/20 transition-colors"
                      >
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Elimina percorso"
        message={`Eliminare "${deleteTarget?.title}"? Tutti i passi del percorso verranno rimossi. I corsi del catalogo non vengono toccati.`}
        confirmLabel="Elimina"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
