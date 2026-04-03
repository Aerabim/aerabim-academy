'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormField } from '@/components/admin/ui/FormField';
import { FormSelect } from '@/components/admin/ui/FormSelect';
import { FormTextarea } from '@/components/admin/ui/FormTextarea';
import { ThumbnailUploader } from './ThumbnailUploader';
import { PreviewVideoUploader } from './PreviewVideoUploader';
import type { Course } from '@/types';

interface CourseFormProps {
  course?: Course;
  /** Unique form ID so external submit buttons can trigger this form */
  formId?: string;
}

const AREA_OPTIONS = [
  { value: 'SW', label: 'Software Operativo' },
  { value: 'NL', label: 'Normativa & Legal' },
  { value: 'OB', label: 'OpenBIM & Standard' },
  { value: 'PG', label: 'Processi & Governance' },
  { value: 'AI', label: 'AI & Automazione' },
];

const LEVEL_OPTIONS = [
  { value: 'L1', label: 'Base' },
  { value: 'L2', label: 'Intermedio' },
  { value: 'L3', label: 'Avanzato' },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CourseForm({ course, formId = 'course-form' }: CourseFormProps) {
  const router = useRouter();
  const isEditing = !!course;

  const [title, setTitle] = useState(course?.title ?? '');
  const [slug, setSlug] = useState(course?.slug ?? '');
  const [description, setDescription] = useState(course?.description ?? '');
  const [area, setArea] = useState(course?.area ?? '');
  const [level, setLevel] = useState(course?.level ?? '');
  const [priceSingle, setPriceSingle] = useState(
    course ? String(course.price_single / 100) : '',
  );
  const [isFree, setIsFree] = useState(course?.is_free ?? false);
  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnail_url ?? '');
  const [slugManual, setSlugManual] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugManual) {
      setSlug(slugify(val));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        title,
        slug,
        description: description || undefined,
        area,
        level,
        priceSingle: isFree ? 0 : Math.round(parseFloat(priceSingle || '0') * 100),
        isFree,
        thumbnailUrl: thumbnailUrl || undefined,
      };

      const url = isEditing
        ? `/api/admin/courses/${course.id}`
        : '/api/admin/courses';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Errore durante il salvataggio.');
        return;
      }

      if (isEditing) {
        window.dispatchEvent(new CustomEvent('course-saved'));
        router.refresh();
      } else {
        router.push(`/admin/corsi/${data.course.id}`);
      }
    } catch {
      setError('Errore di rete.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5 w-full">
      {error && (
        <div className="px-4 py-3 bg-accent-rose/10 border border-accent-rose/20 rounded-md text-[0.82rem] text-accent-rose">
          {error}
        </div>
      )}

      <FormField
        label="Titolo"
        id="title"
        value={title}
        onChange={handleTitleChange}
        placeholder="es. Modellazione BIM con Revit"
        required
      />

      <div className="space-y-1.5">
        <FormField
          label="Slug"
          id="slug"
          value={slug}
          onChange={(val) => { setSlug(val); setSlugManual(true); }}
          placeholder="modellazione-bim-con-revit"
          required
          hint="Usato nell'URL del corso. Generato automaticamente dal titolo."
        />
      </div>

      <FormTextarea
        label="Descrizione"
        id="description"
        value={description}
        onChange={setDescription}
        placeholder="Descrizione del corso..."
        rows={4}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormSelect
          label="Area"
          id="area"
          value={area}
          onChange={setArea}
          options={AREA_OPTIONS}
          placeholder="Seleziona area"
          required
        />
        <FormSelect
          label="Livello"
          id="level"
          value={level}
          onChange={setLevel}
          options={LEVEL_OPTIONS}
          placeholder="Seleziona livello"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Prezzo (EUR)"
          id="price"
          type="number"
          value={isFree ? '0' : priceSingle}
          onChange={setPriceSingle}
          placeholder="89.00"
          disabled={isFree}
          hint="In euro, non centesimi."
        />
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="w-4 h-4 rounded border-border-subtle bg-surface-2 text-accent-cyan focus:ring-accent-cyan/20"
            />
            <span className="text-[0.82rem] text-text-secondary">Corso gratuito</span>
          </label>
        </div>
      </div>

      <ThumbnailUploader
        courseId={course?.id}
        currentUrl={thumbnailUrl}
        onUploaded={setThumbnailUrl}
      />

      {course?.id && (
        <PreviewVideoUploader
          courseId={course.id}
          currentPlaybackId={course.preview_playback_id ?? null}
          onUploaded={(pbId, assetId) => {
            fetch(`/api/admin/courses/${course.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ previewPlaybackId: pbId, previewAssetId: assetId }),
            }).catch(() => undefined);
          }}
        />
      )}

    </form>
  );
}
