'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LearningPathMaterial, AddLearningPathMaterialPayload } from '@/types';

interface PathMaterialListProps {
  pathId: string;
  initialMaterials: LearningPathMaterial[];
}

const TYPE_CONFIG = {
  pdf:  { label: 'PDF',  class: 'text-accent-rose   bg-accent-rose/10   border-accent-rose/20' },
  link: { label: 'Link', class: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20' },
};

export function PathMaterialList({ pathId, initialMaterials }: PathMaterialListProps) {
  const router = useRouter();
  const [materials, setMaterials] = useState(initialMaterials);

  // Add form state
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [materialType, setMaterialType] = useState<'pdf' | 'link'>('link');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editType, setEditType] = useState<'pdf' | 'link'>('link');
  const [editSaving, setEditSaving] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Il titolo è obbligatorio.'); return; }
    if (!url.trim())   { setError('L\'URL è obbligatorio.'); return; }

    setSaving(true);
    setError(null);
    try {
      const payload: AddLearningPathMaterialPayload = {
        title: title.trim(),
        url: url.trim(),
        materialType,
      };
      const res = await fetch(`/api/admin/learning-paths/${pathId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as { material?: LearningPathMaterial; error?: string };
      if (!res.ok) {
        setError(json.error ?? 'Errore durante l\'aggiunta.');
        return;
      }
      if (json.material) setMaterials((prev) => [...prev, json.material!]);
      setTitle(''); setUrl(''); setMaterialType('link');
      setFormOpen(false);
      router.refresh();
    } catch {
      setError('Errore di rete.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(m: LearningPathMaterial) {
    setEditingId(m.id);
    setEditTitle(m.title);
    setEditUrl(m.url);
    setEditType(m.materialType);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/learning-paths/${pathId}/materials/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim(), url: editUrl.trim(), materialType: editType }),
      });
      if (res.ok) {
        setMaterials((prev) => prev.map((m) =>
          m.id === editingId
            ? { ...m, title: editTitle.trim(), url: editUrl.trim(), materialType: editType }
            : m,
        ));
        setEditingId(null);
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/admin/learning-paths/${pathId}/materials/${id}`, { method: 'DELETE' });
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  const sorted = [...materials].sort((a, b) => a.orderNum - b.orderNum);

  return (
    <div className="space-y-3">
      {/* List */}
      {sorted.length === 0 && !formOpen ? (
        <div className="text-center py-10 text-text-muted text-[0.83rem] border border-dashed border-border-subtle rounded-lg">
          Nessun materiale aggiunto. I materiali vengono resi disponibili agli iscritti al percorso.
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((m) => (
            editingId === m.id ? (
              <form
                key={m.id}
                onSubmit={handleEdit}
                className="p-4 border border-accent-cyan/20 bg-accent-cyan/5 rounded-lg space-y-3"
              >
                <div className="text-[0.78rem] font-semibold text-accent-cyan">Modifica materiale</div>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Titolo *"
                  className="w-full px-3 py-2 text-[0.82rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
                />
                <input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="URL *"
                  className="w-full px-3 py-2 text-[0.82rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
                />
                <div className="flex items-center gap-4">
                  {(['link', 'pdf'] as const).map((t) => (
                    <label key={t} className="flex items-center gap-1.5 text-[0.8rem] text-text-secondary cursor-pointer">
                      <input type="radio" value={t} checked={editType === t} onChange={() => setEditType(t)} />
                      {TYPE_CONFIG[t].label}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="px-4 py-1.5 text-[0.8rem] font-semibold rounded-md bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors disabled:opacity-50"
                  >
                    {editSaving ? 'Salvataggio...' : 'Salva'}
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="px-4 py-1.5 text-[0.8rem] text-text-secondary hover:text-text-primary transition-colors">
                    Annulla
                  </button>
                </div>
              </form>
            ) : (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3 bg-surface-2 border border-border-subtle rounded-lg">
                {/* Type badge */}
                <span className={cn(
                  'text-[0.64rem] font-semibold px-1.5 py-0.5 rounded border shrink-0',
                  TYPE_CONFIG[m.materialType].class,
                )}>
                  {TYPE_CONFIG[m.materialType].label}
                </span>

                {/* Title + URL */}
                <div className="flex-1 min-w-0">
                  <div className="text-[0.82rem] font-medium text-text-primary">{m.title}</div>
                  <div className="text-[0.7rem] text-text-muted truncate">{m.url}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Apri"
                    className="p-1.5 rounded text-text-muted hover:text-accent-cyan transition-colors"
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                  <button
                    onClick={() => startEdit(m)}
                    title="Modifica"
                    className="p-1.5 rounded text-text-muted hover:text-text-primary transition-colors"
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={deletingId === m.id}
                    title="Elimina"
                    className="p-1.5 rounded text-text-muted hover:text-accent-rose transition-colors disabled:opacity-40"
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Add form */}
      {formOpen && (
        <form onSubmit={handleAdd} className="p-4 border border-border-subtle bg-surface-2 rounded-lg space-y-3">
          <div className="text-[0.78rem] font-semibold text-text-primary">Aggiungi materiale</div>
          <input
            placeholder="Titolo *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-[0.82rem] bg-surface-1 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
          />
          <input
            placeholder="URL *"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 text-[0.82rem] bg-surface-1 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
          />
          <div className="flex items-center gap-4">
            {(['link', 'pdf'] as const).map((t) => (
              <label key={t} className="flex items-center gap-1.5 text-[0.8rem] text-text-secondary cursor-pointer">
                <input type="radio" value={t} checked={materialType === t} onChange={() => setMaterialType(t)} />
                {TYPE_CONFIG[t].label}
              </label>
            ))}
          </div>
          {error && (
            <div className="text-[0.78rem] text-accent-rose">{error}</div>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 text-[0.8rem] font-semibold rounded-md bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors disabled:opacity-50"
            >
              {saving ? 'Aggiunta...' : 'Aggiungi'}
            </button>
            <button
              type="button"
              onClick={() => { setFormOpen(false); setError(null); setTitle(''); setUrl(''); setMaterialType('link'); }}
              className="px-4 py-1.5 text-[0.8rem] text-text-secondary hover:text-text-primary transition-colors"
            >
              Annulla
            </button>
          </div>
        </form>
      )}

      {/* Add button */}
      {!formOpen && (
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-[0.82rem] font-semibold rounded-md bg-surface-2 border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Aggiungi materiale
        </button>
      )}
    </div>
  );
}
