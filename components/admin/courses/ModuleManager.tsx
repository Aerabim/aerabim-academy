'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { LessonManager } from './LessonManager';
import type { AdminModuleWithLessons } from '@/types';

interface ModuleManagerProps {
  courseId: string;
  modules: AdminModuleWithLessons[];
}

export function ModuleManager({ courseId, modules: initialModules }: ModuleManagerProps) {
  const router = useRouter();
  const [modules, setModules] = useState(initialModules);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminModuleWithLessons | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(initialModules.map((m) => m.id)),
  );

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAddModule() {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        const newModule: AdminModuleWithLessons = {
          id: data.module.id,
          courseId,
          title: newTitle.trim(),
          orderNum: modules.length + 1,
          lessons: [],
        };
        setModules((prev) => [...prev, newModule]);
        setExpandedIds((prev) => { const next = new Set(Array.from(prev)); next.add(data.module.id); return next; });
        setNewTitle('');
      }
    } catch (err) {
      console.error('Add module error:', err);
    } finally {
      setAdding(false);
    }
  }

  async function handleUpdateTitle(moduleId: string) {
    if (!editTitle.trim()) return;
    try {
      await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? { ...m, title: editTitle.trim() } : m)),
      );
      setEditingId(null);
    } catch (err) {
      console.error('Update module error:', err);
    }
  }

  async function handleMove(moduleId: string, direction: 'up' | 'down') {
    const idx = modules.findIndex((m) => m.id === moduleId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= modules.length) return;

    const reordered = [...modules];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    const items = reordered.map((m, i) => ({ id: m.id, orderNum: i + 1 }));

    setModules(reordered.map((m, i) => ({ ...m, orderNum: i + 1 })));

    try {
      await fetch(`/api/admin/courses/${courseId}/modules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
    } catch (err) {
      console.error('Reorder modules error:', err);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/modules/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setModules((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      }
    } catch (err) {
      console.error('Delete module error:', err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-[1rem] font-heading font-semibold text-text-primary">
        Moduli e Lezioni
      </h3>

      {modules.length === 0 && (
        <div className="px-4 py-6 bg-surface-1 border border-border-subtle rounded-lg text-center text-[0.82rem] text-text-muted">
          Nessun modulo. Aggiungi il primo modulo qui sotto.
        </div>
      )}

      {modules.map((mod, idx) => (
        <div key={mod.id} className="bg-surface-1 border border-border-subtle rounded-lg overflow-hidden">
          {/* Module header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-surface-2/30 border-b border-border-subtle">
            <button onClick={() => toggleExpand(mod.id)} className="text-text-muted hover:text-text-primary transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                className={cn('transition-transform', expandedIds.has(mod.id) && 'rotate-90')}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <span className="text-[0.7rem] text-text-muted font-mono">{idx + 1}.</span>

            {editingId === mod.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle(mod.id)}
                  className="flex-1 px-2 py-1 bg-surface-2 border border-border-subtle rounded text-[0.82rem] text-text-primary focus:outline-none focus:border-accent-cyan/50"
                  autoFocus
                />
                <button onClick={() => handleUpdateTitle(mod.id)} className="text-[0.72rem] text-accent-cyan hover:underline">Salva</button>
                <button onClick={() => setEditingId(null)} className="text-[0.72rem] text-text-muted hover:underline">Annulla</button>
              </div>
            ) : (
              <span
                className="text-[0.85rem] font-medium text-text-primary flex-1 cursor-pointer hover:text-accent-cyan transition-colors"
                onClick={() => { setEditingId(mod.id); setEditTitle(mod.title); }}
              >
                {mod.title}
              </span>
            )}

            <span className="text-[0.7rem] text-text-muted">{mod.lessons.length} lezioni</span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleMove(mod.id, 'up')}
                disabled={idx === 0}
                className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                title="Sposta su"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 15l-6-6-6 6" />
                </svg>
              </button>
              <button
                onClick={() => handleMove(mod.id, 'down')}
                disabled={idx === modules.length - 1}
                className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                title="Sposta giù"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <button
                onClick={() => setDeleteTarget(mod)}
                className="p-1 text-text-muted hover:text-accent-rose transition-colors"
                title="Elimina modulo"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Lessons */}
          {expandedIds.has(mod.id) && (
            <div className="px-4 py-3">
              <LessonManager courseId={courseId} moduleId={mod.id} lessons={mod.lessons} />
            </div>
          )}
        </div>
      ))}

      {/* Add module form */}
      <div className="flex items-center gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddModule()}
          placeholder="Titolo nuovo modulo..."
          className="flex-1 px-3 py-2 bg-surface-2 border border-border-subtle rounded-md text-[0.82rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20 transition-all"
        />
        <button
          onClick={handleAddModule}
          disabled={adding || !newTitle.trim()}
          className="px-4 py-2 bg-accent-cyan/15 text-accent-cyan text-[0.8rem] font-semibold rounded-md border border-accent-cyan/20 hover:bg-accent-cyan/25 transition-colors disabled:opacity-50 shrink-0"
        >
          {adding ? '...' : '+ Modulo'}
        </button>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Elimina modulo"
        message={`Eliminare "${deleteTarget?.title}" e tutte le sue lezioni?`}
        confirmLabel="Elimina"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
