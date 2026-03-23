'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
}

const MUX_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  waiting: { label: 'In attesa', color: 'text-text-muted' },
  preparing: { label: 'Elaborazione', color: 'text-accent-amber' },
  ready: { label: 'Pronto', color: 'text-accent-emerald' },
  errored: { label: 'Errore', color: 'text-accent-rose' },
};

export function LessonManager({ courseId, moduleId, lessons: initialLessons }: LessonManagerProps) {
  const router = useRouter();
  const [lessons, setLessons] = useState(initialLessons);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<AdminLessonDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminLessonDetail | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/lessons/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setLessons((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      }
    } catch (err) {
      console.error('Delete lesson error:', err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  function handleSaved(newLesson?: AdminLessonDetail) {
    if (newLesson) {
      setLessons((prev) => [...prev, newLesson]);
    } else if (editingLesson) {
      // Edit case — refresh to get updated data
      router.refresh();
    }
    setShowForm(false);
    setEditingLesson(null);
  }

  return (
    <div className="space-y-2">
      {lessons.length === 0 && !showForm && (
        <p className="text-[0.78rem] text-text-muted py-2">Nessuna lezione in questo modulo.</p>
      )}

      {lessons.map((lesson) => {
        const typeConf = LESSON_TYPE_CONFIG[lesson.type as keyof typeof LESSON_TYPE_CONFIG];
        const muxStatus = lesson.type === 'video' ? MUX_STATUS_LABELS[lesson.muxStatus] : null;

        return (
          <div
            key={lesson.id}
            className="flex items-center gap-3 px-3 py-2 bg-surface-2/30 rounded-md hover:bg-surface-2/50 transition-colors group"
          >
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
                onClick={() => setEditingLesson(lesson)}
                className="text-[0.72rem] text-accent-cyan hover:underline"
              >
                Modifica
              </button>
              <button
                onClick={() => setDeleteTarget(lesson)}
                className="text-[0.72rem] text-accent-rose hover:underline"
              >
                Elimina
              </button>
            </div>
          </div>
        );
      })}

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
