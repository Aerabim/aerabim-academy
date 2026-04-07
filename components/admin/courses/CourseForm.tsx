'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormField } from '@/components/admin/ui/FormField';
import { FormSelect } from '@/components/admin/ui/FormSelect';
import { FormTextarea } from '@/components/admin/ui/FormTextarea';
import { ThumbnailUploader } from './ThumbnailUploader';
import { PreviewVideoUploader } from './PreviewVideoUploader';
import { useCourseTabsContext } from './CourseNavTabs';
import type { Course } from '@/types';

interface CourseFormProps {
  course?: Course;
  /** Unique form ID so external submit buttons can trigger this form */
  formId?: string;
  /** Total video duration derived from lessons (seconds), for sync hint */
  computedDurationSec?: number;
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

export function CourseForm({ course, formId = 'course-form', computedDurationSec }: CourseFormProps) {
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
  const [isFeatured, setIsFeatured] = useState(course?.is_featured ?? false);
  const [durationMin, setDurationMin] = useState(
    course?.duration_min != null ? String(course.duration_min) : '',
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnail_url ?? '');
  const [thumbnailExpandedUrl, setThumbnailExpandedUrl] = useState(course?.thumbnail_expanded_url ?? '');
  const [slugManual, setSlugManual] = useState(isEditing);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const { setIsDirty, setIsSaving } = useCourseTabsContext();

  // Sync dirty state to tabs context
  useEffect(() => {
    setIsDirty(hasChanges);
  }, [hasChanges, setIsDirty]);

  // Warn on browser refresh / tab close when dirty
  useEffect(() => {
    if (!hasChanges) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  function markDirty() { setHasChanges(true); }

  function handleTitleChange(val: string) {
    setTitle(val);
    markDirty();
    if (!slugManual) setSlug(slugify(val));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    setIsSaving(true);

    try {
      const parsedDuration = durationMin !== '' ? parseInt(durationMin, 10) : undefined;
      if (parsedDuration !== undefined && (isNaN(parsedDuration) || parsedDuration < 1)) {
        setError('La durata deve essere un numero intero positivo.');
        return;
      }

      const payload = {
        title,
        slug,
        description: description || undefined,
        area,
        level,
        priceSingle: isFree ? 0 : Math.round(parseFloat(priceSingle || '0') * 100),
        isFree,
        isFeatured,
        durationMin: parsedDuration,
        thumbnailUrl: thumbnailUrl || undefined,
        thumbnailExpandedUrl: thumbnailExpandedUrl || undefined,
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
        setHasChanges(false);
        window.dispatchEvent(new CustomEvent('course-saved'));
        router.refresh();
      } else {
        router.push(`/admin/corsi/${data.course.id}`);
      }
    } catch {
      setError('Errore di rete.');
    } finally {
      setSaving(false);
      setIsSaving(false);
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
          onChange={(val) => { setSlug(val); setSlugManual(true); markDirty(); }}
          placeholder="modellazione-bim-con-revit"
          required
          hint="Usato nell'URL del corso. Generato automaticamente dal titolo."
        />
      </div>

      <FormTextarea
        label="Descrizione"
        id="description"
        value={description}
        onChange={(val) => { setDescription(val); markDirty(); }}
        placeholder="Descrizione del corso..."
        rows={4}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormSelect
          label="Area"
          id="area"
          value={area}
          onChange={(val) => { setArea(val); markDirty(); }}
          options={AREA_OPTIONS}
          placeholder="Seleziona area"
          required
        />
        <FormSelect
          label="Livello"
          id="level"
          value={level}
          onChange={(val) => { setLevel(val); markDirty(); }}
          options={LEVEL_OPTIONS}
          placeholder="Seleziona livello"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField
          label="Prezzo (EUR)"
          id="price"
          type="number"
          value={isFree ? '0' : priceSingle}
          onChange={(val) => { setPriceSingle(val); markDirty(); }}
          placeholder="89.00"
          disabled={isFree}
          hint="In euro, non centesimi."
        />
        <div className="space-y-1">
          <FormField
            label="Durata (minuti)"
            id="duration"
            type="number"
            value={durationMin}
            onChange={(val) => { setDurationMin(val); markDirty(); }}
            placeholder="es. 120"
            hint="Durata totale stimata del corso."
            min={1}
            step={1}
          />
          {(() => {
            if (!computedDurationSec || computedDurationSec <= 0) return null;
            const computedMin = Math.round(computedDurationSec / 60);
            const manualMin = durationMin !== '' ? parseInt(durationMin, 10) : null;
            const inSync = manualMin !== null && !isNaN(manualMin) && manualMin === computedMin;
            if (inSync) return (
              <p className="text-[0.7rem] text-accent-emerald">
                ✓ In sync con le lezioni ({computedMin}m calcolati)
              </p>
            );
            return (
              <p className="text-[0.7rem] text-accent-amber flex items-center gap-1.5 flex-wrap">
                Calcolato dalle lezioni: <strong>{computedMin}m</strong>
                <button
                  type="button"
                  onClick={() => { setDurationMin(String(computedMin)); markDirty(); }}
                  className="underline hover:text-text-primary transition-colors"
                >
                  Sincronizza
                </button>
              </p>
            );
          })()}
        </div>
        <div className="flex flex-col gap-2 justify-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => { setIsFree(e.target.checked); markDirty(); }}
              className="w-4 h-4 rounded border-border-subtle bg-surface-2 text-accent-cyan focus:ring-accent-cyan/20"
            />
            <span className="text-[0.82rem] text-text-secondary">Corso gratuito</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => { setIsFeatured(e.target.checked); markDirty(); }}
              className="w-4 h-4 rounded border-border-subtle bg-surface-2 text-accent-cyan focus:ring-accent-cyan/20"
            />
            <span className="text-[0.82rem] text-text-secondary">In evidenza</span>
          </label>
        </div>
      </div>

      {/* Stripe Price ID — read-only, only when editing */}
      {isEditing && (
        <div className="space-y-1.5">
          <label className="block text-[0.78rem] font-medium text-text-secondary">
            Stripe Price ID
          </label>
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-2/50 border border-border-subtle rounded-md">
            <span className="flex-1 text-[0.78rem] font-mono text-text-muted truncate">
              {course?.stripe_price_id ?? <span className="italic">non collegato</span>}
            </span>
            {course?.stripe_price_id && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(course.stripe_price_id!).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                title="Copia negli appunti"
                className="shrink-0 text-text-muted hover:text-accent-cyan transition-colors"
              >
                {copied ? (
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-accent-emerald">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            )}
          </div>
          <p className="text-[0.7rem] text-text-muted">Collegato automaticamente a Stripe. Sola lettura.</p>
        </div>
      )}

      {/* Thumbnails side-by-side — proportional columns so heights align visually */}
      <div className="grid grid-cols-[5fr_8fr] gap-4 items-start">
        <ThumbnailUploader
          courseId={course?.id}
          currentUrl={thumbnailUrl}
          onUploaded={(url) => { setThumbnailUrl(url); markDirty(); }}
          label="Copertina portrait"
          hint="Card collapsed — formato verticale 3:4."
        />
        <ThumbnailUploader
          courseId={course?.id}
          currentUrl={thumbnailExpandedUrl}
          onUploaded={(url) => { setThumbnailExpandedUrl(url); markDirty(); }}
          variant="expanded"
          label="Copertina landscape"
          hint="Card expanded — formato orizzontale 16:9."
        />
      </div>

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
