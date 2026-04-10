'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import type { AdminLearningPathListItem, LearningPathStatus } from '@/types';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<LearningPathStatus, {
  label: string; dotClass: string; btnClass: string; btnActiveClass: string;
}> = {
  draft: {
    label: 'Bozza',
    dotClass: 'bg-text-muted',
    btnClass: 'bg-surface-3 text-text-muted hover:text-text-secondary',
    btnActiveClass: 'text-text-muted bg-surface-3/50 cursor-default',
  },
  hidden: {
    label: 'Nascosto',
    dotClass: 'bg-accent-amber',
    btnClass: 'bg-accent-amber/10 text-accent-amber hover:bg-accent-amber/20',
    btnActiveClass: 'text-accent-amber bg-accent-amber/5 cursor-default',
  },
  published: {
    label: 'Pubblicato',
    dotClass: 'bg-accent-emerald',
    btnClass: 'bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20',
    btnActiveClass: 'text-accent-emerald bg-accent-emerald/5 cursor-default',
  },
  private: {
    label: 'Privato',
    dotClass: 'bg-accent-violet',
    btnClass: 'bg-accent-violet/10 text-accent-violet hover:bg-accent-violet/20',
    btnActiveClass: 'text-accent-violet bg-accent-violet/5 cursor-default',
  },
  archived: {
    label: 'Archiviato',
    dotClass: 'bg-accent-rose',
    btnClass: 'bg-accent-rose/10 text-accent-rose hover:bg-accent-rose/20',
    btnActiveClass: 'text-accent-rose bg-accent-rose/5 cursor-default',
  },
};

const STATUS_ORDER: LearningPathStatus[] = ['draft', 'hidden', 'published', 'private', 'archived'];

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortCol = 'title' | 'courses' | 'updated';
type SortDir = 'asc' | 'desc';

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
      className={cn('shrink-0 transition-colors', active ? 'text-accent-cyan' : 'text-text-muted/40')}
    >
      {active && dir === 'asc'
        ? <path d="M12 19V5M5 12l7-7 7 7" />
        : active && dir === 'desc'
        ? <path d="M12 5v14M5 12l7 7 7-7" />
        : <><path d="M12 5v14" /><path d="M5 9l7-7 7 7" opacity={0.4} /><path d="M5 15l7 7 7-7" opacity={0.4} /></>
      }
    </svg>
  );
}

// ─── Completeness indicator ───────────────────────────────────────────────────

interface CheckItem { label: string; ok: boolean }

function completenessChecks(path: AdminLearningPathListItem): CheckItem[] {
  return [
    { label: 'Copertina', ok: !!path.thumbnailUrl },
    { label: 'Corsi',     ok: path.courseCount > 0 },
  ];
}

function CompletenessIndicator({ path }: { path: AdminLearningPathListItem }) {
  const checks = completenessChecks(path);
  const score = checks.filter((c) => c.ok).length;
  const total = checks.length;
  const allOk = score === total;
  const missing = checks.filter((c) => !c.ok).map((c) => c.label);

  return (
    <div className="group relative flex items-center gap-0.5 mt-1">
      {checks.map((c, i) => (
        <span
          key={i}
          className={cn(
            'w-2.5 h-1 rounded-full transition-colors',
            c.ok ? 'bg-accent-emerald/70' : 'bg-surface-4',
          )}
        />
      ))}
      {!allOk && (
        <span className="ml-1 text-[0.62rem] text-text-muted">{score}/{total}</span>
      )}
      {!allOk && (
        <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-20 bg-surface-3 border border-border-subtle rounded-md px-2.5 py-2 shadow-lg min-w-[140px]">
          <p className="text-[0.68rem] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Mancante</p>
          {missing.map((m) => (
            <div key={m} className="flex items-center gap-1.5 text-[0.72rem] text-text-secondary">
              <span className="w-1 h-1 rounded-full bg-accent-rose shrink-0" />
              {m}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Drag handle ─────────────────────────────────────────────────────────────

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

// ─── Sortable row ─────────────────────────────────────────────────────────────

function SortableRow({
  path,
  onDelete,
  onDuplicate,
  duplicating,
  statusOpen,
  openStatusDropdown,
  statusBtnRef,
}: {
  path: AdminLearningPathListItem;
  onDelete: (p: AdminLearningPathListItem) => void;
  onDuplicate: (p: AdminLearningPathListItem) => void;
  duplicating: string | null;
  statusOpen: string | null;
  openStatusDropdown: (id: string) => void;
  statusBtnRef: (el: HTMLButtonElement | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: path.id });
  const cfg = STATUS_CONFIG[path.status] ?? STATUS_CONFIG.draft;

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
        <div className="text-text-muted text-[0.72rem] mt-0.5">/{path.slug}{path.estimatedHours ? ` · ~${path.estimatedHours}h` : ''}</div>
        <CompletenessIndicator path={path} />
      </td>
      <td className="px-4 py-3 text-center text-text-secondary">{path.courseCount}</td>
      <td className="px-4 py-3">
        <button
          ref={statusBtnRef}
          onClick={() => openStatusDropdown(path.id)}
          className={cn(
            'flex items-center gap-1.5 text-[0.72rem] font-semibold px-2.5 py-1 rounded-md transition-colors',
            cfg.btnClass,
          )}
        >
          <span className={cn('w-2 h-2 rounded-full shrink-0', cfg.dotClass)} />
          {cfg.label}
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            className={cn('transition-transform', statusOpen === path.id && 'rotate-180')}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </td>
      <td className="px-4 py-3 text-[0.78rem] text-text-muted whitespace-nowrap">
        {new Date(path.updatedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {path.status === 'published' && (
            <Link
              href={`/learning-paths/${path.slug}`}
              target="_blank"
              title="Anteprima pubblica"
              className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-accent-emerald hover:bg-accent-emerald/10 transition-colors"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Link>
          )}
          <Link
            href={`/admin/learning-paths/${path.id}`}
            title="Modifica"
            className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Link>
          <button
            onClick={() => onDuplicate(path)}
            disabled={duplicating === path.id}
            title="Duplica"
            className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-accent-amber hover:bg-accent-amber/10 transition-colors disabled:opacity-40"
          >
            {duplicating === path.id
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              : <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
            }
          </button>
          <button
            onClick={() => onDelete(path)}
            title="Elimina"
            className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-accent-rose hover:bg-accent-rose/10 transition-colors"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main table ───────────────────────────────────────────────────────────────

interface LearningPathTableProps {
  paths: AdminLearningPathListItem[];
}

export function LearningPathTable({ paths: initialPaths }: LearningPathTableProps) {
  const router = useRouter();
  const [paths, setPaths] = useState(initialPaths);
  const [filter, setFilter] = useState('');
  const [filterStatus, setFilterStatus] = useState<LearningPathStatus | ''>('');
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [deleteTarget, setDeleteTarget] = useState<AdminLearningPathListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusOpen, setStatusOpen] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const statusBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const openStatusDropdown = useCallback((pathId: string) => {
    if (statusOpen === pathId) {
      setStatusOpen(null);
      setDropdownPos(null);
      return;
    }
    const btn = statusBtnRefs.current.get(pathId);
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setStatusOpen(pathId);
  }, [statusOpen]);

  useEffect(() => {
    if (!statusOpen) return;
    const openId = statusOpen;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const btn = statusBtnRefs.current.get(openId);
      if (btn?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setStatusOpen(null);
      setDropdownPos(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [statusOpen]);

  function toggleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<LearningPathStatus, number>> = {};
    for (const p of paths) {
      counts[p.status] = (counts[p.status] ?? 0) + 1;
    }
    return counts;
  }, [paths]);

  const filtered = useMemo(() => {
    let list = paths.filter((p) => {
      const matchesText = p.title.toLowerCase().includes(filter.toLowerCase());
      const matchesStatus = filterStatus === '' || p.status === filterStatus;
      return matchesText && matchesStatus;
    });
    if (sortCol) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortCol === 'title')   cmp = a.title.localeCompare(b.title, 'it');
        if (sortCol === 'courses') cmp = a.courseCount - b.courseCount;
        if (sortCol === 'updated') cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [paths, filter, filterStatus, sortCol, sortDir]);

  const canReorder = filter.trim() === '' && filterStatus === '' && !sortCol;

  const STATUS_PILL: Record<LearningPathStatus, { dot: string; active: string; hover: string }> = {
    published: { dot: 'bg-accent-emerald', active: 'bg-accent-emerald/15 text-accent-emerald border-accent-emerald/30', hover: 'hover:bg-accent-emerald/8 hover:text-accent-emerald hover:border-accent-emerald/20' },
    draft:     { dot: 'bg-text-muted',     active: 'bg-surface-3 text-text-secondary border-border-hover',              hover: 'hover:bg-surface-2 hover:text-text-secondary hover:border-border-hover' },
    hidden:    { dot: 'bg-accent-amber',   active: 'bg-accent-amber/15 text-accent-amber border-accent-amber/30',       hover: 'hover:bg-accent-amber/8 hover:text-accent-amber hover:border-accent-amber/20' },
    private:   { dot: 'bg-accent-violet',  active: 'bg-accent-violet/15 text-accent-violet border-accent-violet/30',    hover: 'hover:bg-accent-violet/8 hover:text-accent-violet hover:border-accent-violet/20' },
    archived:  { dot: 'bg-accent-rose',    active: 'bg-accent-rose/15 text-accent-rose border-accent-rose/30',          hover: 'hover:bg-accent-rose/8 hover:text-accent-rose hover:border-accent-rose/20' },
  };

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

  async function handleDuplicate(path: AdminLearningPathListItem) {
    setDuplicating(path.id);
    try {
      const res = await fetch(`/api/admin/learning-paths/${path.id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json() as { path: { id: string } };
        router.push(`/admin/learning-paths/${data.path.id}`);
      } else {
        const json = await res.json() as { error?: string };
        alert(json.error ?? 'Errore durante la duplicazione.');
      }
    } catch {
      alert('Errore di rete.');
    } finally {
      setDuplicating(null);
    }
  }

  async function handleChangeStatus(path: AdminLearningPathListItem, newStatus: LearningPathStatus) {
    if (path.status === newStatus) return;
    try {
      const res = await fetch(`/api/admin/learning-paths/${path.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setPaths((prev) => prev.map((p) => p.id === path.id ? { ...p, status: newStatus } : p));
        router.refresh();
      }
    } catch (err) {
      console.error('Change status error:', err);
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
      {/* Status pills */}
      {paths.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFilterStatus('')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.72rem] font-medium border transition-colors',
              filterStatus === ''
                ? 'bg-surface-3 text-text-primary border-border-hover'
                : 'bg-surface-1 text-text-muted border-border-subtle hover:bg-surface-2 hover:text-text-secondary',
            )}
          >
            Tutti
            <span className="font-heading font-bold">{paths.length}</span>
          </button>
          {STATUS_ORDER.filter((s) => (statusCounts[s] ?? 0) > 0).map((s) => {
            const pill = STATUS_PILL[s];
            const count = statusCounts[s] ?? 0;
            const isActive = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(isActive ? '' : s)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.72rem] font-medium border transition-colors',
                  isActive
                    ? pill.active
                    : cn('bg-surface-1 text-text-muted border-border-subtle', pill.hover),
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', pill.dot)} />
                {STATUS_CONFIG[s].label}
                <span className="font-heading font-bold">{count}</span>
              </button>
            );
          })}
        </div>
      )}

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
              Rimuovi filtri e ordinamento per riordinare
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={canReorder ? handleDragEnd : undefined}
        >
          <div className="overflow-x-auto rounded-lg border border-border-subtle">
            <table className="w-full text-[0.82rem]">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-2">
                  <th className="w-10 px-3 py-3" />
                  <th className="text-left px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">
                    <button onClick={() => toggleSort('title')} className="flex items-center gap-1.5 uppercase tracking-wider hover:text-text-secondary transition-colors">
                      Percorso <SortIcon active={sortCol === 'title'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-center px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">
                    <button onClick={() => toggleSort('courses')} className="flex items-center gap-1.5 uppercase tracking-wider hover:text-text-secondary transition-colors mx-auto">
                      Corsi <SortIcon active={sortCol === 'courses'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Stato</th>
                  <th className="text-left px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">
                    <button onClick={() => toggleSort('updated')} className="flex items-center gap-1.5 uppercase tracking-wider hover:text-text-secondary transition-colors">
                      Ultima modifica <SortIcon active={sortCol === 'updated'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Azioni</th>
                </tr>
              </thead>
              <SortableContext items={paths.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {filtered.map((path) => (
                    <SortableRow
                      key={path.id}
                      path={path}
                      onDelete={setDeleteTarget}
                      onDuplicate={handleDuplicate}
                      duplicating={duplicating}
                      statusOpen={statusOpen}
                      openStatusDropdown={openStatusDropdown}
                      statusBtnRef={(el) => {
                        if (el) statusBtnRefs.current.set(path.id, el);
                        else statusBtnRefs.current.delete(path.id);
                      }}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </div>
        </DndContext>
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

      {/* Status dropdown portal */}
      {statusOpen && dropdownPos && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-50 min-w-[160px] bg-surface-2 border border-border-subtle rounded-lg shadow-lg py-1"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          {STATUS_ORDER.map((s) => {
            const conf = STATUS_CONFIG[s];
            const path = paths.find((p) => p.id === statusOpen);
            const isCurrent = path?.status === s;
            return (
              <button
                key={s}
                onClick={() => {
                  if (path) handleChangeStatus(path, s);
                  setStatusOpen(null);
                  setDropdownPos(null);
                }}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-[0.78rem] transition-colors flex items-center gap-2',
                  isCurrent ? conf.btnActiveClass : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary',
                )}
              >
                <span className={cn('w-2 h-2 rounded-full shrink-0', conf.dotClass)} />
                {conf.label}
                {isCurrent && <span className="ml-auto text-[0.68rem] text-text-muted">attuale</span>}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
