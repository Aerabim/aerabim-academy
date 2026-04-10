'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThumbnailUploader } from '@/components/admin/courses/ThumbnailUploader';
import { PathPreviewVideoUploader } from './PathPreviewVideoUploader';
import { RichTextEditor } from '@/components/admin/ui/RichTextEditor';
import { useLearningPathTabsContext } from './LearningPathNavTabs';
import type { LearningPath } from '@/types';

interface LearningPathFormProps {
  /** Provide for edit mode; omit for create mode */
  path?: LearningPath;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function LearningPathForm({ path }: LearningPathFormProps) {
  const router = useRouter();
  const isEdit = !!path;

  const { setIsDirty, setIsSaving, isSaving } = useLearningPathTabsContext();

  const [title, setTitle] = useState(path?.title ?? '');
  const [slug, setSlug] = useState(path?.slug ?? '');
  const [subtitle, setSubtitle] = useState(path?.subtitle ?? '');
  const [description, setDescription] = useState(path?.description ?? '');
  const [estimatedHours, setEstimatedHours] = useState(
    path?.estimated_hours?.toString() ?? '',
  );
  const [priceEur, setPriceEur] = useState(
    path?.price_single ? (path.price_single / 100).toFixed(2) : '',
  );
  const [proDiscountPct, setProDiscountPct] = useState(
    (path as unknown as { pro_discount_pct?: number })?.pro_discount_pct?.toString() ?? '0',
  );
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [localSaving, setLocalSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saving = isEdit ? isSaving : localSaving;

  // Auto-generate slug from title in create mode
  useEffect(() => {
    if (!slugTouched && !isEdit) {
      setSlug(slugify(title));
    }
  }, [title, slugTouched, isEdit]);

  function markDirty() {
    if (isEdit) setIsDirty(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError('Il titolo è obbligatorio.'); return; }
    if (!slug.trim())  { setError('Lo slug è obbligatorio.'); return; }

    if (isEdit) {
      setIsSaving(true);
    } else {
      setLocalSaving(true);
    }

    try {
      const parsedPrice = parseFloat(priceEur);
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        subtitle: subtitle.trim() || undefined,
        description: description.trim() || undefined,
        estimatedHours: estimatedHours ? parseInt(estimatedHours, 10) : undefined,
        ...(isEdit && !isNaN(parsedPrice) && parsedPrice >= 0 && {
          priceInCents: Math.round(parsedPrice * 100),
        }),
        ...(isEdit && {
          proDiscountPct: parseInt(proDiscountPct, 10) || 0,
        }),
      };

      const url = isEdit
        ? `/api/admin/learning-paths/${path.id}`
        : '/api/admin/learning-paths';

      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json() as { path?: { id: string; slug: string }; error?: string };

      if (!res.ok) {
        setError(json.error ?? 'Errore durante il salvataggio.');
        return;
      }

      if (!isEdit && json.path?.id) {
        router.push(`/admin/learning-paths/${json.path.id}`);
      } else {
        setIsDirty(false);
        window.dispatchEvent(new Event('learning-path-saved'));
        router.refresh();
      }
    } catch {
      setError('Errore di rete.');
    } finally {
      if (isEdit) {
        setIsSaving(false);
      } else {
        setLocalSaving(false);
      }
    }
  }

  return (
    <form id="learning-path-form" onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="px-4 py-2.5 rounded-md bg-accent-rose/10 border border-accent-rose/20 text-[0.82rem] text-accent-rose">
          {error}
        </div>
      )}

      {/* Thumbnail + video preview — edit mode only */}
      {isEdit && (
        <>
          <ThumbnailUploader
            courseId={path.id}
            currentUrl={path.thumbnail_url ?? ''}
            variant="landscape"
            label="Immagine di copertina del percorso"
            hint="Usata come sfondo del banner. Formato consigliato: 1280×360px (landscape)."
            currentPosition={(path as unknown as { thumbnail_position: string }).thumbnail_position ?? '50% 50%'}
            onUploaded={async (url) => {
              await fetch(`/api/admin/learning-paths/${path.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ thumbnailUrl: url }),
              });
            }}
            onPositionChange={(pos) => {
              fetch(`/api/admin/learning-paths/${path.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ thumbnailPosition: pos }),
              }).catch(() => undefined);
            }}
          />
          <PathPreviewVideoUploader
            pathId={path.id}
            currentPlaybackId={path.preview_playback_id ?? null}
            onUploaded={(pbId, assetId) => {
              fetch(`/api/admin/learning-paths/${path.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ previewPlaybackId: pbId, previewAssetId: assetId }),
              }).catch(() => undefined);
            }}
          />
        </>
      )}

      {/* Title + Slug */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[0.78rem] font-medium text-text-secondary">
            Titolo <span className="text-accent-rose">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty(); }}
            placeholder="es. BIM Coordinator"
            className="w-full px-3 py-2 text-[0.83rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[0.78rem] font-medium text-text-secondary">
            Slug <span className="text-accent-rose">*</span>
          </label>
          <input
            value={slug}
            onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); markDirty(); }}
            placeholder="es. bim-coordinator"
            className="w-full px-3 py-2 text-[0.83rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 font-mono"
          />
        </div>
      </div>

      {/* Subtitle */}
      <div className="space-y-1.5">
        <label className="text-[0.78rem] font-medium text-text-secondary">Sottotitolo</label>
        <input
          value={subtitle}
          onChange={(e) => { setSubtitle(e.target.value); markDirty(); }}
          placeholder="es. Per gestire la digitalizzazione BIM nei progetti complessi"
          className="w-full px-3 py-2 text-[0.83rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-[0.78rem] font-medium text-text-secondary">Descrizione</label>
        <RichTextEditor
          value={description}
          onChange={(html) => { setDescription(html); markDirty(); }}
          placeholder="Descrivi il percorso formativo..."
        />
      </div>

      {/* Estimated Hours + Prezzo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[0.78rem] font-medium text-text-secondary">Ore stimate</label>
          <input
            type="number"
            min={1}
            value={estimatedHours}
            onChange={(e) => { setEstimatedHours(e.target.value); markDirty(); }}
            placeholder="es. 20"
            className="w-full px-3 py-2 text-[0.83rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
          />
        </div>
        {isEdit && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[0.78rem] font-medium text-text-secondary">
                Prezzo (€)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={priceEur}
                onChange={(e) => { setPriceEur(e.target.value); markDirty(); }}
                placeholder="es. 149.00"
                className="w-full px-3 py-2 text-[0.83rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-amber/50"
              />
              <p className="text-[0.68rem] text-text-muted">
                Salva per creare automaticamente il Stripe Price.
                {path?.stripe_price_id && (
                  <span className="text-accent-emerald ml-1">✓ Stripe configurato</span>
                )}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.78rem] font-medium text-text-secondary">
                Sconto PRO (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={proDiscountPct}
                  onChange={(e) => { setProDiscountPct(e.target.value); markDirty(); }}
                  placeholder="es. 40"
                  className="w-full px-3 py-2 pr-8 text-[0.83rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-amber/50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.75rem] text-text-muted">%</span>
              </div>
              <p className="text-[0.68rem] text-text-muted">
                Sconto applicato automaticamente agli utenti con abbonamento PRO attivo. 0 = nessuno sconto.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Inline save button — create mode only (edit mode uses the sticky footer) */}
      {!isEdit && (
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={localSaving}
            className="px-5 py-2 text-[0.83rem] font-semibold rounded-md bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors disabled:opacity-50"
          >
            {localSaving ? 'Salvataggio...' : 'Crea percorso'}
          </button>
        </div>
      )}
    </form>
  );
}
