'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import type { AdminLearningPathListItem } from '@/types';

/* ── Drag handle icon ── */
function DragHandle({ listeners, attributes }: { listeners: SyntheticListenerMap | undefined; attributes: DraggableAttributes }) {
  return (
    <button
      type="button"
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing p-1 text-text-muted hover:text-text-secondary transition-colors touch-none"
      title="Trascina per riordinare"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <circle cx="4" cy="3" r="1.3" />
        <circle cx="4" cy="7" r="1.3" />
        <circle cx="4" cy="11" r="1.3" />
        <circle cx="9" cy="3" r="1.3" />
        <circle cx="9" cy="7" r="1.3" />
        <circle cx="9" cy="11" r="1.3" />
      </svg>
    </button>
  );
}

/* ── Sortable row ── */
function SortableRow({
  path,
  onDelete,
}: {
  path: AdminLearningPathListItem;
  onDelete: (p: AdminLearningPathListItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: path.id });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'border-b border-border-subtle/50 transition-colors',
        isDragging ? 'opacity-50 bg-surface-2' : 'hover:bg-surface-2/50',
      )}
    >
      <td className="px-3 py-3">
        <DragHandle listeners={listeners} attributes={attributes} />
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-text-primary">{path.title}</div>
        {path.estimatedHours && (
          <div className="text-text-muted text-[0.72rem] mt-0.5">~{path.estimatedHours}h</div>
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
            onClick={() => onDelete(path)}
            className="px-3 py-1.5 text-[0.75rem] font-medium rounded-md bg-accent-rose/10 border border-accent-rose/20 text-accent-rose hover:bg-accent-rose/20 transition-colors"
          >
            Elimina
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ── Main table ── */

interface LearningPathTableProps {
  paths: AdminLearningPathListItem[];
}

export function LearningPathTable({ paths: initialPaths }: LearningPathTableProps) {
  const router = useRouter();
  const [paths, setPaths] = useState(initialPaths);
  const [filter, setFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminLearningPathListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const filtered = paths.filter((p) =>
    p.title.toLowerCase().includes(filter.toLowerCase()),
  );

  /* Reorder is only possible when no filter is active */
  const canReorder = filter.trim() === '';

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = paths.findIndex((p) => p.id === active.id);
    const newIndex = paths.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(paths, oldIndex, newIndex);
    setPaths(reordered);

    setSaving(true);
    try {
      await fetch('/api/admin/learning-paths/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: reordered.map((p, i) => ({ id: p.id, orderNum: i + 1 })),
        }),
      });
      router.refresh();
    } catch {
      // silent — order is already reflected in local state
    } finally {
      setSaving(false);
    }
  }

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
          placeholder="Cerca percorso..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-xs px-3 py-2 text-[0.82rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
        />
        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-[0.75rem] text-text-muted">Salvataggio ordine...</span>
          )}
          {!canReorder && (
            <span className="text-[0.72rem] text-text-muted italic">
              Rimuovi il filtro per riordinare
            </span>
          )}
          <Link
            href="/admin/learning-paths/nuovo"
            className="shrink-0 px-4 py-2 text-[0.82rem] font-semibold rounded-md bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors"
          >
            + Nuovo percorso
          </Link>
        </div>
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
                <th className="w-10 px-3 py-3" />
                <th className="text-left px-4 py-3 text-text-muted font-semibold">Percorso</th>
                <th className="text-center px-4 py-3 text-text-muted font-semibold">Passi</th>
                <th className="text-center px-4 py-3 text-text-muted font-semibold">Corsi</th>
                <th className="text-left px-4 py-3 text-text-muted font-semibold">Stato</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={canReorder ? handleDragEnd : undefined}
            >
              <SortableContext items={paths.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {filtered.map((path) => (
                    <SortableRow
                      key={path.id}
                      path={path}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
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
