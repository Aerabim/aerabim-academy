'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { LessonForm } from './LessonForm';
import { LESSON_TYPE_CONFIG } from '@/lib/area-config';
import type { AdminLessonDetail } from '@/types';

interface LessonManagerProps {
  courseId: string;
  moduleId: string;
  lessons: AdminLessonDetail[];
  onLessonCountChange?: (moduleId: string, count: number) => void;
}

const MUX_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  waiting: { label: 'In attesa', color: 'text-text-muted' },
  preparing: { label: 'Elaborazione', color: 'text-accent-amber' },
  ready: { label: 'Pronto', color: 'text-accent-emerald' },
  errored: { label: 'Errore', color: 'text-accent-rose' },
};

function SortableLessonRow({
  lesson,
  onEdit,
  onDelete,
}: {
  lesson: AdminLessonDetail;
  onEdit: (l: AdminLessonDetail) => void;
  onDelete: (l: AdminLessonDetail) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeConf = LESSON_TYPE_CONFIG[lesson.type as keyof typeof LESSON_TYPE_CONFIG];
  const muxStatus = lesson.type === 'video' ? MUX_STATUS_LABELS[lesson.muxStatus] : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 px-3 py-2 bg-surface-2/30 rounded-md hover:bg-surface-2/50 transition-colors group',
        isDragging && 'opacity-50 shadow-lg ring-1 ring-accent-cyan/30',
      )}
    >
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

      <span className="text-[0.7rem] text-text-muted font-mono w-5 text-right shrink-0">
        {lesson.orderNum}
      </span>

      {typeConf && (
        <Badge variant={typeConf.badgeVariant} className="text-[0.58rem] shrink-0">
          {typeConf.label}
        </Badge>
      )}

      <span className="text-[0.82rem] text-text-primary flex-1 truncate">
        {lesson.title}
      </span>

      {lesson.isPreview && (
        <span className="text-[0.6rem] text-accent-amber font-bold uppercase">Preview</span>
      )}

      {muxStatus && (
        <span className={cn('text-[0.68rem] font-medium', muxStatus.color)}>
          {muxStatus.label}
        </span>
      )}

      {lesson.type === 'material' && (
        <span className={cn('text-[0.68rem] font-medium', lesson.materialUrl ? 'text-accent-emerald' : 'text-text-muted')}>
          {lesson.materialUrl ? 'File caricato' : 'Nessun file'}
        </span>
      )}

      {lesson.type === 'quiz' && (
        <span className="text-[0.68rem] text-text-muted">
          {lesson.quizQuestionCount} domande
        </span>
      )}

      {lesson.durationSec != null && lesson.durationSec > 0 && (
        <span className="text-[0.68rem] text-text-muted">
          {Math.round(lesson.durationSec / 60)}min
        </span>
      )}

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(lesson)}
          className="text-[0.72rem] text-accent-cyan hover:underline"
        >
          Modifica
        </button>
        <button
          onClick={() => onDelete(lesson)}
          className="text-[0.72rem] text-accent-rose hover:underline"
        >
          Elimina
        </button>
      </div>
    </div>
  );
}

export function LessonManager({ courseId, moduleId, lessons: initialLessons, onLessonCountChange }: LessonManagerProps) {
  const [lessons, setLessons] = useState(initialLessons);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<AdminLessonDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminLessonDetail | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const persistOrder = useCallback(async (reordered: AdminLessonDetail[]) => {
    const items = reordered.map((l, i) => ({ id: l.id, orderNum: i + 1 }));
    try {
      await fetch(`/api/admin/courses/${courseId}/lessons`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
    } catch (err) {
      console.error('Reorder lessons error:', err);
    }
  }, [courseId]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLessons((prev) => {
      const oldIndex = prev.findIndex((l) => l.id === active.id);
      const newIndex = prev.findIndex((l) => l.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;

      const reordered = [...prev];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      const renumbered = reordered.map((l, i) => ({ ...l, orderNum: i + 1 }));
      persistOrder(renumbered);
      return renumbered;
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/lessons/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setLessons((prev) => {
          const next = prev
            .filter((l) => l.id !== deleteTarget.id)
            .map((l, i) => ({ ...l, orderNum: i + 1 }));
          onLessonCountChange?.(moduleId, next.length);
          return next;
        });
      }
    } catch (err) {
      console.error('Delete lesson error:', err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  function handleSaved(lesson?: AdminLessonDetail) {
    if (lesson && editingLesson) {
      setLessons((prev) => prev.map((l) => (l.id === lesson.id ? lesson : l)));
    } else if (lesson) {
      setLessons((prev) => {
        const next = [...prev, lesson];
        onLessonCountChange?.(moduleId, next.length);
        return next;
      });
    }
    setShowForm(false);
    setEditingLesson(null);
  }

  return (
    <div className="space-y-2">
      {lessons.length === 0 && !showForm && (
        <p className="text-[0.78rem] text-text-muted py-2">Nessuna lezione in questo modulo.</p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {lessons.map((lesson) => (
            <SortableLessonRow
              key={lesson.id}
              lesson={lesson}
              onEdit={setEditingLesson}
              onDelete={setDeleteTarget}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add/edit lesson form */}
      {(showForm || editingLesson) && (
        <LessonForm
          courseId={courseId}
          moduleId={moduleId}
          lesson={editingLesson ?? undefined}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditingLesson(null); }}
        />
      )}

      {!showForm && !editingLesson && (
        <button
          onClick={() => setShowForm(true)}
          className="text-[0.78rem] text-accent-cyan hover:underline mt-1"
        >
          + Aggiungi lezione
        </button>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Elimina lezione"
        message={`Eliminare la lezione "${deleteTarget?.title}"?`}
        confirmLabel="Elimina"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
