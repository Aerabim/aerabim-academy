'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import type { CourseMaterial } from '@/types';

interface CourseMaterialsManagerProps {
  courseId: string;
  initialMaterials: CourseMaterial[];
}

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf:  'bg-accent-rose/15 text-accent-rose',
  pptx: 'bg-accent-amber/15 text-accent-amber',
  xlsx: 'bg-accent-emerald/15 text-accent-emerald',
  docx: 'bg-brand-light/20 text-brand-light',
  rvt:  'bg-accent-cyan/15 text-accent-cyan',
  rfa:  'bg-accent-cyan/15 text-accent-cyan',
  nwd:  'bg-violet-400/15 text-violet-400',
  nwc:  'bg-violet-400/15 text-violet-400',
  dwg:  'bg-accent-amber/15 text-accent-amber',
  dxf:  'bg-accent-amber/15 text-accent-amber',
  ifc:  'bg-accent-cyan/15 text-accent-cyan',
  exe:  'bg-accent-rose/15 text-accent-rose',
  zip:  'bg-brand-gray/20 text-brand-light',
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CourseMaterialsManager({ courseId, initialMaterials }: CourseMaterialsManagerProps) {
  const [materials, setMaterials] = useState<CourseMaterial[]>(initialMaterials);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CourseMaterial | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);

    try {
      // 1. Upload file
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch(`/api/admin/courses/${courseId}/materials/upload`, {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setUploadError(uploadData.error ?? 'Errore durante il caricamento.');
        return;
      }

      // 2. Create material record
      const createRes = await fetch(`/api/admin/courses/${courseId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: file.name.replace(/\.[^.]+$/, ''),
          fileUrl: uploadData.fileUrl,
          fileName: uploadData.fileName,
          fileType: uploadData.fileType,
          fileSize: uploadData.fileSize,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        setUploadError(createData.error ?? 'Errore durante il salvataggio.');
        return;
      }

      const m = createData.material;
      setMaterials((prev) => [...prev, {
        id: m.id,
        courseId: m.course_id,
        title: m.title,
        fileUrl: m.file_url,
        fileName: m.file_name,
        fileType: m.file_type,
        fileSize: m.file_size,
        orderNum: m.order_num,
        createdAt: m.created_at,
      }]);
    } catch {
      setUploadError('Errore di rete.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function startEdit(mat: CourseMaterial) {
    setEditingId(mat.id);
    setEditTitle(mat.title);
  }

  async function saveTitle(mat: CourseMaterial) {
    if (!editTitle.trim() || editTitle.trim() === mat.title) {
      setEditingId(null);
      return;
    }
    setSavingTitle(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/materials/${mat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (res.ok) {
        setMaterials((prev) =>
          prev.map((m) => m.id === mat.id ? { ...m, title: editTitle.trim() } : m),
        );
      }
    } catch {
      // silently ignore
    } finally {
      setSavingTitle(false);
      setEditingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/materials/${deleteTarget.id}`,
        { method: 'DELETE' },
      );
      if (res.ok) {
        setMaterials((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      }
    } catch {
      // silently ignore
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-[0.85rem] font-bold text-text-primary">
          Materiali del corso
        </h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-[0.75rem] font-semibold px-3 py-1.5 bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20 rounded-md hover:bg-accent-cyan/25 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Caricamento...
            </>
          ) : (
            <>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Carica file
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.pptx,.xlsx,.docx,.rvt,.rfa,.nwd,.nwc,.dwg,.dxf,.ifc,.exe,.zip"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {uploadError && (
        <p className="text-[0.75rem] text-accent-rose">{uploadError}</p>
      )}

      {/* List */}
      {materials.length === 0 ? (
        <p className="text-[0.78rem] text-text-muted py-2">
          Nessun materiale caricato per questo corso.
        </p>
      ) : (
        <div className="space-y-2">
          {materials.map((mat) => {
            const tagColor = FILE_TYPE_COLORS[mat.fileType] ?? 'bg-surface-3 text-text-muted';
            return (
              <div
                key={mat.id}
                className="flex items-center gap-3 px-3 py-2 bg-surface-2/30 rounded-md hover:bg-surface-2/50 transition-colors group"
              >
                {/* Type badge */}
                <span className={cn('text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded shrink-0', tagColor)}>
                  {mat.fileType}
                </span>

                {/* Title — editable */}
                {editingId === mat.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => saveTitle(mat)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveTitle(mat);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    disabled={savingTitle}
                    className="flex-1 text-[0.82rem] bg-surface-2 border border-accent-cyan/30 rounded px-2 py-0.5 text-text-primary outline-none"
                  />
                ) : (
                  <span
                    className="text-[0.82rem] text-text-primary flex-1 truncate cursor-pointer hover:text-accent-cyan transition-colors"
                    title="Clicca per rinominare"
                    onClick={() => startEdit(mat)}
                  >
                    {mat.title}
                  </span>
                )}

                {/* File size */}
                {mat.fileSize && (
                  <span className="text-[0.65rem] text-text-muted shrink-0">
                    {formatBytes(mat.fileSize)}
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <a
                    href={mat.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.72rem] text-accent-cyan hover:underline"
                  >
                    Scarica
                  </a>
                  <button
                    onClick={() => setDeleteTarget(mat)}
                    className="text-[0.72rem] text-accent-rose hover:underline"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Elimina materiale"
        message={`Eliminare "${deleteTarget?.title}"? Il file verrà rimosso definitivamente.`}
        confirmLabel={deleting ? 'Eliminazione...' : 'Elimina'}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
