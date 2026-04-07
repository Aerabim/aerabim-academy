'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { LessonManager } from './LessonManager';
import type { AdminModuleWithLessons } from '@/types';

interface ModuleManagerProps {
  courseId: string;
  modules: AdminModuleWithLessons[];
}

// ─── Sortable module row ──────────────────────────────────────────────────────

interface SortableModuleProps {
  courseId: string;
  mod: AdminModuleWithLessons;
  index: number;
  isExpanded: boolean;
  isEditing: boolean;
  editTitle: string;
  lessonCount: number;
  onToggleExpand: (id: string) => void;
  onStartEdit: (id: string, title: string) => void;
  onEditTitleChange: (val: string) => void;
  onSaveTitle: (id: string) => void;
  onCancelEdit: () => void;
  onDeleteRequest: (mod: AdminModuleWithLessons) => void;
  onLessonCountChange: (moduleId: string, count: number) => void;
}

function SortableModule({
  courseId, mod, index, isExpanded, isEditing, editTitle, lessonCount,
  onToggleExpand, onStartEdit, onEditTitleChange, onSaveTitle, onCancelEdit,
  onDeleteRequest, onLessonCountChange,
}: SortableModuleProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mod.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-surface-1 border border-border-subtle rounded-lg overflow-hidden',
        isDragging && 'opacity-50 shadow-xl ring-1 ring-accent-cyan/30',
      )}
    >
      {/* Module header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-2/30 border-b border-border-subtle">
        {/* Drag handle */}
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary shrink-0 touch-none"
          {...attributes}
          {...listeners}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="4.5" cy="3" r="1.2" />
            <circle cx="9.5" cy="3" r="1.2" />
            <circle cx="4.5" cy="7" r="1.2" />
            <circle cx="9.5" cy="7" r="1.2" />
            <circle cx="4.5" cy="11" r="1.2" />
            <circle cx="9.5" cy="11" r="1.2" />
          </svg>
        </button>

        <button
          onClick={() => onToggleExpand(mod.id)}
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          <svg
            width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            className={cn('transition-transform', isExpanded && 'rotate-90')}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <span className="text-[0.7rem] text-text-muted font-mono">{index + 1}.</span>

        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSaveTitle(mod.id)}
              className="flex-1 px-2 py-1 bg-surface-2 border border-border-subtle rounded text-[0.82rem] text-text-primary focus:outline-none focus:border-accent-cyan/50"
              autoFocus
            />
            <button onClick={() => onSaveTitle(mod.id)} className="text-[0.72rem] text-accent-cyan hover:underline">Salva</button>
            <button onClick={onCancelEdit} className="text-[0.72rem] text-text-muted hover:underline">Annulla</button>
          </div>
        ) : (
          <span
            className="text-[0.85rem] font-medium text-text-primary flex-1 cursor-pointer hover:text-accent-cyan transition-colors"
            onClick={() => onStartEdit(mod.id, mod.title)}
          >
            {mod.title}
          </span>
        )}

        <span className="text-[0.7rem] text-text-muted">{lessonCount} lezioni</span>

        <button
          onClick={() => onDeleteRequest(mod)}
          className="p-1 text-text-muted hover:text-accent-rose transition-colors"
          title="Elimina modulo"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Lessons */}
      {isExpanded && (
        <div className="px-4 py-3">
          <LessonManager
            courseId={courseId}
            moduleId={mod.id}
            lessons={mod.lessons}
            onLessonCountChange={onLessonCountChange}
          />
        </div>
      )}
    </div>
  );
}

// ─── Module manager ───────────────────────────────────────────────────────────

export function ModuleManager({ courseId, modules: initialModules }: ModuleManagerProps) {
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
  const [lessonCounts, setLessonCounts] = useState<Map<string, number>>(new Map());
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const persistOrder = useCallback(async (reordered: AdminModuleWithLessons[]) => {
    const items = reordered.map((m, i) => ({ id: m.id, orderNum: i + 1 }));
    try {
      await fetch(`/api/admin/courses/${courseId}/modules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
    } catch (err) {
      console.error('Reorder modules error:', err);
    }
  }, [courseId]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setModules((prev) => {
      const oldIndex = prev.findIndex((m) => m.id === active.id);
      const newIndex = prev.findIndex((m) => m.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;

      const reordered = [...prev];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      const renumbered = reordered.map((m, i) => ({ ...m, orderNum: i + 1 }));
      persistOrder(renumbered);
      return renumbered;
    });
  }

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
        setExpandedIds((prev) => new Set([...prev, data.module.id]));
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

  function handleLessonCountChange(moduleId: string, count: number) {
    setLessonCounts((prev) => new Map(prev).set(moduleId, count));
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {modules.map((mod, idx) => (
              <SortableModule
                key={mod.id}
                courseId={courseId}
                mod={mod}
                index={idx}
                isExpanded={expandedIds.has(mod.id)}
                isEditing={editingId === mod.id}
                editTitle={editTitle}
                lessonCount={lessonCounts.get(mod.id) ?? mod.lessons.length}
                onToggleExpand={toggleExpand}
                onStartEdit={(id, title) => { setEditingId(id); setEditTitle(title); }}
                onEditTitleChange={setEditTitle}
                onSaveTitle={handleUpdateTitle}
                onCancelEdit={() => setEditingId(null)}
                onDeleteRequest={setDeleteTarget}
                onLessonCountChange={handleLessonCountChange}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={null}>
          {activeId ? (() => {
            const mod = modules.find((m) => m.id === activeId);
            if (!mod) return null;
            return (
              <div className="bg-surface-1 border border-accent-cyan/40 rounded-lg overflow-hidden shadow-xl opacity-95 cursor-grabbing">
                <div className="flex items-center gap-2 px-4 py-3 bg-surface-2/30">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-text-muted shrink-0">
                    <circle cx="4.5" cy="3" r="1.2" /><circle cx="9.5" cy="3" r="1.2" />
                    <circle cx="4.5" cy="7" r="1.2" /><circle cx="9.5" cy="7" r="1.2" />
                    <circle cx="4.5" cy="11" r="1.2" /><circle cx="9.5" cy="11" r="1.2" />
                  </svg>
                  <span className="text-[0.85rem] font-medium text-text-primary flex-1 truncate">{mod.title}</span>
                  <span className="text-[0.7rem] text-text-muted">
                    {lessonCounts.get(mod.id) ?? mod.lessons.length} lezioni
                  </span>
                </div>
              </div>
            );
          })() : null}
        </DragOverlay>
      </DndContext>

      {/* Add module */}
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
