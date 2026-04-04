'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StepCard } from './StepCard';
import { CoursePickerModal } from './CoursePickerModal';
import type {
  LearningPathStepDisplay,
  AddCourseStepPayload,
  AddVideoStepPayload,
  AddMaterialStepPayload,
} from '@/types';

interface StepListProps {
  pathId: string;
  initialSteps: LearningPathStepDisplay[];
}

type AddMode = 'course' | 'video' | 'material' | null;

export function StepList({ pathId, initialSteps }: StepListProps) {
  const router = useRouter();
  const [steps, setSteps] = useState(initialSteps);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [coursePickerOpen, setCoursePickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Video inline form state
  const [videoTitle, setVideoTitle] = useState('');
  const [videoPlaybackId, setVideoPlaybackId] = useState('');

  // Material inline form state
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialUrl, setMaterialUrl] = useState('');
  const [materialType, setMaterialType] = useState<'pdf' | 'link'>('link');

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const excludedCourseIds = steps
    .filter((s) => s.stepType === 'course')
    .map((s) => (s.stepType === 'course' ? s.courseId : ''));

  async function postStep(payload: AddCourseStepPayload | AddVideoStepPayload | AddMaterialStepPayload) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/learning-paths/${pathId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        setError(json.error ?? 'Errore durante l\'aggiunta del passo.');
        return false;
      }
      return true;
    } catch {
      setError('Errore di rete.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCourse(course: { id: string }) {
    const ok = await postStep({ stepType: 'course', courseId: course.id });
    if (ok) { setAddMode(null); router.refresh(); }
  }

  async function handleAddVideo(e: React.FormEvent) {
    e.preventDefault();
    if (!videoPlaybackId.trim()) { setError('Il Mux Playback ID è obbligatorio.'); return; }
    const ok = await postStep({
      stepType: 'video',
      muxPlaybackId: videoPlaybackId.trim(),
      title: videoTitle.trim() || undefined,
    });
    if (ok) {
      setVideoTitle(''); setVideoPlaybackId(''); setAddMode(null);
      router.refresh();
    }
  }

  async function handleAddMaterial(e: React.FormEvent) {
    e.preventDefault();
    if (!materialUrl.trim()) { setError('L\'URL è obbligatorio.'); return; }
    const ok = await postStep({
      stepType: 'material',
      materialUrl: materialUrl.trim(),
      materialType,
      title: materialTitle.trim() || undefined,
    });
    if (ok) {
      setMaterialTitle(''); setMaterialUrl(''); setMaterialType('link'); setAddMode(null);
      router.refresh();
    }
  }

  async function handleDelete(stepId: string) {
    await fetch(`/api/admin/learning-paths/${pathId}/steps/${stepId}`, { method: 'DELETE' });
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
    router.refresh();
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= steps.length) return;

    const newSteps = [...steps];
    const tempOrder = newSteps[index].orderNum;
    newSteps[index] = { ...newSteps[index], orderNum: newSteps[swapIndex].orderNum };
    newSteps[swapIndex] = { ...newSteps[swapIndex], orderNum: tempOrder };
    ;[newSteps[index], newSteps[swapIndex]] = [newSteps[swapIndex], newSteps[index]];
    setSteps(newSteps);

    await fetch(`/api/admin/learning-paths/${pathId}/steps/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: newSteps.map((s) => ({ id: s.id, orderNum: s.orderNum })) }),
    });
    router.refresh();
  }

  const sortedSteps = [...steps].sort((a, b) => a.orderNum - b.orderNum);

  return (
    <div className="space-y-4">
      {/* Step list */}
      {sortedSteps.length === 0 ? (
        <div className="text-center py-10 text-text-muted text-[0.83rem] border border-dashed border-border-subtle rounded-lg">
          Nessun passo aggiunto. Usa il pulsante qui sotto per costruire il percorso.
        </div>
      ) : (
        <div className="space-y-2">
          {sortedSteps.map((step, i) => (
            <StepCard
              key={step.id}
              step={step}
              isFirst={i === 0}
              isLast={i === sortedSteps.length - 1}
              onMoveUp={() => handleMove(i, 'up')}
              onMoveDown={() => handleMove(i, 'down')}
              onDelete={() => handleDelete(step.id)}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-2.5 rounded-md bg-accent-rose/10 border border-accent-rose/20 text-[0.82rem] text-accent-rose">
          {error}
        </div>
      )}

      {/* Inline form — video */}
      {addMode === 'video' && (
        <form onSubmit={handleAddVideo} className="p-4 border border-accent-amber/20 bg-accent-amber/5 rounded-lg space-y-3">
          <div className="text-[0.82rem] font-semibold text-accent-amber mb-1">Aggiungi video dedicato</div>
          <input
            placeholder="Titolo (opzionale)"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            className="w-full px-3 py-2 text-[0.82rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
          />
          <input
            placeholder="Mux Playback ID *"
            value={videoPlaybackId}
            onChange={(e) => setVideoPlaybackId(e.target.value)}
            className="w-full px-3 py-2 text-[0.82rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 font-mono"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-[0.8rem] font-semibold rounded-md bg-accent-amber/15 text-accent-amber hover:bg-accent-amber/25 border border-accent-amber/20 transition-colors disabled:opacity-50"
            >
              {saving ? 'Aggiunta...' : 'Aggiungi'}
            </button>
            <button type="button" onClick={() => setAddMode(null)} className="px-4 py-2 text-[0.8rem] text-text-secondary hover:text-text-primary transition-colors">
              Annulla
            </button>
          </div>
        </form>
      )}

      {/* Inline form — material */}
      {addMode === 'material' && (
        <form onSubmit={handleAddMaterial} className="p-4 border border-border-subtle bg-surface-2 rounded-lg space-y-3">
          <div className="text-[0.82rem] font-semibold text-text-primary mb-1">Aggiungi materiale</div>
          <input
            placeholder="Titolo (opzionale)"
            value={materialTitle}
            onChange={(e) => setMaterialTitle(e.target.value)}
            className="w-full px-3 py-2 text-[0.82rem] bg-surface-1 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
          />
          <input
            placeholder="URL *"
            value={materialUrl}
            onChange={(e) => setMaterialUrl(e.target.value)}
            className="w-full px-3 py-2 text-[0.82rem] bg-surface-1 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[0.8rem] text-text-secondary cursor-pointer">
              <input type="radio" value="link" checked={materialType === 'link'} onChange={() => setMaterialType('link')} />
              Link
            </label>
            <label className="flex items-center gap-1.5 text-[0.8rem] text-text-secondary cursor-pointer">
              <input type="radio" value="pdf" checked={materialType === 'pdf'} onChange={() => setMaterialType('pdf')} />
              PDF
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-[0.8rem] font-semibold rounded-md bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors disabled:opacity-50"
            >
              {saving ? 'Aggiunta...' : 'Aggiungi'}
            </button>
            <button type="button" onClick={() => setAddMode(null)} className="px-4 py-2 text-[0.8rem] text-text-secondary hover:text-text-primary transition-colors">
              Annulla
            </button>
          </div>
        </form>
      )}

      {/* Add step menu */}
      {addMode === null && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 text-[0.82rem] font-semibold rounded-md bg-surface-2 border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Aggiungi passo
          </button>
          {menuOpen && (
            <div className="absolute left-0 top-full mt-1 z-20 bg-surface-1 border border-border-subtle rounded-lg shadow-xl py-1 w-52">
              <button
                onClick={() => { setMenuOpen(false); setCoursePickerOpen(true); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[0.82rem] text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
              >
                <span className="text-accent-cyan">📚</span> Aggiungi corso
              </button>
              <button
                onClick={() => { setMenuOpen(false); setAddMode('video'); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[0.82rem] text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
              >
                <span className="text-accent-amber">🎬</span> Aggiungi video
              </button>
              <button
                onClick={() => { setMenuOpen(false); setAddMode('material'); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[0.82rem] text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
              >
                <span>📄</span> Aggiungi materiale
              </button>
            </div>
          )}
        </div>
      )}

      <CoursePickerModal
        open={coursePickerOpen}
        excludedCourseIds={excludedCourseIds}
        onSelect={handleAddCourse}
        onClose={() => setCoursePickerOpen(false)}
      />
    </div>
  );
}
