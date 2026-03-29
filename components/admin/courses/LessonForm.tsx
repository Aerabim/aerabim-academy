'use client';

import { useState } from 'react';
import { FormField } from '@/components/admin/ui/FormField';
import { FormSelect } from '@/components/admin/ui/FormSelect';
import { VideoUploader } from './VideoUploader';
import { MaterialUploader } from './MaterialUploader';
import type { AdminLessonDetail } from '@/types';

interface LessonFormProps {
  courseId: string;
  moduleId: string;
  lesson?: AdminLessonDetail;
  onSaved: (lesson?: AdminLessonDetail) => void;
  onCancel: () => void;
}

const TYPE_OPTIONS = [
  { value: 'video', label: 'Video' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'material', label: 'Materiale' },
  { value: 'esercitazione', label: 'Esercitazione' },
];

export function LessonForm({ courseId, moduleId, lesson, onSaved, onCancel }: LessonFormProps) {
  const isEditing = !!lesson;

  const [title, setTitle] = useState(lesson?.title ?? '');
  const [type, setType] = useState<string>(lesson?.type ?? 'video');
  const [isPreview, setIsPreview] = useState(lesson?.isPreview ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError('');
    setSaving(true);

    try {
      const url = isEditing
        ? `/api/admin/courses/${courseId}/lessons/${lesson.id}`
        : `/api/admin/courses/${courseId}/lessons`;
      const method = isEditing ? 'PATCH' : 'POST';

      const payload = isEditing
        ? { title: title.trim(), type, isPreview }
        : { moduleId, title: title.trim(), type, isPreview };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Errore durante il salvataggio.');
        return;
      }

      const data = await res.json();

      const l = data.lesson;
      if (l) {
        const mapped: AdminLessonDetail = {
          id: l.id,
          moduleId: l.module_id,
          title: l.title,
          orderNum: l.order_num,
          type: l.type,
          muxPlaybackId: l.mux_playback_id ?? null,
          muxAssetId: l.mux_asset_id ?? null,
          muxStatus: l.mux_status ?? 'waiting',
          durationSec: l.duration_sec ?? null,
          isPreview: l.is_preview ?? false,
          quizQuestionCount: l.quiz_question_count ?? 0,
          materialUrl: l.material_url ?? null,
        };
        onSaved(mapped);
      } else {
        onSaved();
      }
    } catch {
      setError('Errore di rete.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-surface-2/50 border border-border-subtle rounded-md p-4 space-y-3">
      {error && (
        <div className="text-[0.78rem] text-accent-rose">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Titolo lezione"
            id="lessonTitle"
            value={title}
            onChange={setTitle}
            placeholder="es. Introduzione a Revit"
            required
          />
          <FormSelect
            label="Tipo"
            id="lessonType"
            value={type}
            onChange={setType}
            options={TYPE_OPTIONS}
            disabled={isEditing}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPreview}
            onChange={(e) => setIsPreview(e.target.checked)}
            className="w-4 h-4 rounded border-border-subtle bg-surface-2 text-accent-cyan focus:ring-accent-cyan/20"
          />
          <span className="text-[0.78rem] text-text-secondary">Anteprima gratuita</span>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="px-4 py-1.5 bg-accent-cyan/15 text-accent-cyan text-[0.78rem] font-semibold rounded-md border border-accent-cyan/20 hover:bg-accent-cyan/25 transition-colors disabled:opacity-50"
          >
            {saving ? '...' : isEditing ? 'Salva' : 'Aggiungi'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-[0.78rem] text-text-muted hover:text-text-primary transition-colors"
          >
            Annulla
          </button>
        </div>
      </form>

      {/* Video uploader for existing video lessons */}
      {isEditing && lesson.type === 'video' && (
        <div className="pt-2 border-t border-border-subtle">
          <VideoUploader
            courseId={courseId}
            lessonId={lesson.id}
            currentStatus={lesson.muxStatus}
            currentPlaybackId={lesson.muxPlaybackId}
            currentDurationSec={lesson.durationSec}
          />
        </div>
      )}

      {/* Material uploader for existing material lessons */}
      {isEditing && lesson.type === 'material' && (
        <div className="pt-2 border-t border-border-subtle">
          <MaterialUploader courseId={courseId} lessonId={lesson.id} currentUrl={lesson.materialUrl} />
        </div>
      )}
    </div>
  );
}
