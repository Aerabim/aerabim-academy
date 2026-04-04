'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LEVEL_LABELS } from '@/lib/area-config';
import type { LearningPath, LevelCode } from '@/types';

const TARGET_ROLES = [
  'BIM Specialist',
  'BIM Coordinator',
  'BIM Manager',
  'RUP / DEC',
  'Progettista BIM',
  'Calcolatore BIM',
  'Responsabile PA',
];

const LEVELS: LevelCode[] = ['L1', 'L2', 'L3'];

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

  const [title, setTitle] = useState(path?.title ?? '');
  const [slug, setSlug] = useState(path?.slug ?? '');
  const [subtitle, setSubtitle] = useState(path?.subtitle ?? '');
  const [description, setDescription] = useState(path?.description ?? '');
  const [targetRole, setTargetRole] = useState(path?.target_role ?? '');
  const [level, setLevel] = useState<LevelCode | ''>(
    (path?.level as LevelCode | null) ?? '',
  );
  const [estimatedHours, setEstimatedHours] = useState(
    path?.estimated_hours?.toString() ?? '',
  );
  const [isPublished, setIsPublished] = useState(path?.is_published ?? false);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from title in create mode
  useEffect(() => {
    if (!slugTouched && !isEdit) {
      setSlug(slugify(title));
    }
  }, [title, slugTouched, isEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError('Il titolo è obbligatorio.'); return; }
    if (!slug.trim())  { setError('Lo slug è obbligatorio.'); return; }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        subtitle: subtitle.trim() || undefined,
        description: description.trim() || undefined,
        targetRole: targetRole.trim() || undefined,
        level: (level as LevelCode) || undefined,
        estimatedHours: estimatedHours ? parseInt(estimatedHours, 10) : undefined,
        ...(isEdit && { isPublished }),
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
        router.refresh();
      }
    } catch {
      setError('Errore di rete.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="px-4 py-2.5 rounded-md bg-accent-rose/10 border border-accent-rose/20 text-[0.82rem] text-accent-rose">
          {error}
        </div>
      )}

      {/* Title + Slug */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[0.78rem] font-medium text-text-secondary">
            Titolo <span className="text-accent-rose">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
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
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="es. Per gestire la digitalizzazione BIM nei progetti complessi"
          className="w-full px-3 py-2 text-[0.83rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-[0.78rem] font-medium text-text-secondary">Descrizione</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Descrivi il percorso formativo..."
          className="w-full px-3 py-2 text-[0.83rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 resize-none"
        />
      </div>

      {/* Target Role + Level + Hours */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-[0.78rem] font-medium text-text-secondary">Ruolo target</label>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full px-3 py-2 text-[0.83rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary focus:outline-none focus:border-accent-cyan/50"
          >
            <option value="">— Nessuno —</option>
            {TARGET_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[0.78rem] font-medium text-text-secondary">Livello</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as LevelCode | '')}
            className="w-full px-3 py-2 text-[0.83rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary focus:outline-none focus:border-accent-cyan/50"
          >
            <option value="">— Nessuno —</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[0.78rem] font-medium text-text-secondary">Ore stimate</label>
          <input
            type="number"
            min={1}
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            placeholder="es. 20"
            className="w-full px-3 py-2 text-[0.83rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
          />
        </div>
      </div>

      {/* Published toggle — edit mode only */}
      {isEdit && (
        <div className="flex items-center justify-between px-4 py-3 rounded-md bg-surface-2 border border-border-subtle">
          <div>
            <div className="text-[0.82rem] font-medium text-text-primary">Pubblicato</div>
            <div className="text-[0.72rem] text-text-muted mt-0.5">
              Se attivo il percorso è visibile agli utenti
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPublished((v) => !v)}
            className={cn(
              'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors',
              isPublished ? 'bg-accent-cyan' : 'bg-surface-3 border border-border-subtle',
            )}
          >
            <span className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
              isPublished ? 'translate-x-4' : 'translate-x-0.5',
            )} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 text-[0.83rem] font-semibold rounded-md bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvataggio...' : isEdit ? 'Salva modifiche' : 'Crea percorso'}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={() => router.push('/admin/learning-paths')}
            className="px-4 py-2 text-[0.83rem] font-medium rounded-md text-text-secondary hover:text-text-primary transition-colors"
          >
            Torna alla lista
          </button>
        )}
      </div>
    </form>
  );
}
