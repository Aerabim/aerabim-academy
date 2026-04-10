'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PathCourseCard } from './PathCourseCard';
import { CoursePickerModal } from './CoursePickerModal';
import type { LearningPathCourse } from '@/types';

// ─── Sortable item ────────────────────────────────────────────────────────────

function SortableCourseItem({
  entry,
  onDelete,
}: {
  entry: LearningPathCourse;
  onDelete: () => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.courseId,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-50' : undefined}
    >
      <PathCourseCard
        entry={entry}
        onDelete={onDelete}
        dragListeners={listeners}
        dragAttributes={attributes}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CourseListProps {
  pathId: string;
  initialCourses: LearningPathCourse[];
}

export function CourseList({ pathId, initialCourses }: CourseListProps) {
  const router = useRouter();
  const [courses, setCourses] = useState(initialCourses);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const sorted = [...courses].sort((a, b) => a.orderNum - b.orderNum);
  const excludedCourseIds = courses.map((c) => c.courseId);

  async function handleAdd(course: { id: string }) {
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/learning-paths/${pathId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        setError(json.error ?? 'Errore durante l\'aggiunta del corso.');
        return;
      }
      setPickerOpen(false);
      router.refresh();
    } catch {
      setError('Errore di rete.');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(courseId: string) {
    await fetch(`/api/admin/learning-paths/${pathId}/courses/${courseId}`, { method: 'DELETE' });
    setCourses((prev) => prev.filter((c) => c.courseId !== courseId));
    router.refresh();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sorted.findIndex((c) => c.courseId === active.id);
    const newIndex = sorted.findIndex((c) => c.courseId === over.id);
    const reordered = arrayMove(sorted, oldIndex, newIndex).map((c, i) => ({
      ...c,
      orderNum: i + 1,
    }));
    setCourses(reordered);

    await fetch(`/api/admin/learning-paths/${pathId}/courses/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: reordered.map((c) => ({ courseId: c.courseId, orderNum: c.orderNum })),
      }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {/* List */}
      {sorted.length === 0 ? (
        <div className="text-center py-10 text-text-muted text-[0.83rem] border border-dashed border-border-subtle rounded-lg">
          Nessun corso aggiunto. Usa il pulsante qui sotto per costruire il percorso.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sorted.map((c) => c.courseId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sorted.map((entry) => (
                <SortableCourseItem
                  key={entry.courseId}
                  entry={entry}
                  onDelete={() => handleDelete(entry.courseId)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-2.5 rounded-md bg-accent-rose/10 border border-accent-rose/20 text-[0.82rem] text-accent-rose">
          {error}
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => setPickerOpen(true)}
        disabled={adding}
        className="flex items-center gap-2 px-4 py-2 text-[0.82rem] font-semibold rounded-md bg-surface-2 border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors disabled:opacity-50"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
        </svg>
        Aggiungi corso
      </button>

      <CoursePickerModal
        open={pickerOpen}
        excludedCourseIds={excludedCourseIds}
        onSelect={handleAdd}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
