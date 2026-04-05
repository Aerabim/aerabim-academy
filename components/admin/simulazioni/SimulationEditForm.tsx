'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { SimulationRow } from '@/types';

interface PathOption {
  id: string;
  title: string;
}

const ACCENT_TIPO: Record<'scritto' | 'pratico', string> = {
  scritto: '#F0A500',
  pratico: '#4ECDC4',
};

interface SimulationEditFormProps {
  simulation: SimulationRow;
}

/* ── Inline ThumbnailUploader per simulazioni ── */

function SimulationThumbnailUploader({
  simId,
  currentUrl,
  onUploaded,
}: {
  simId: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(currentUrl ?? '');
  const [uploadError, setUploadError] = useState('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploading(true);
    setProgress(0);

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('simId', simId);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/simulations/upload-thumbnail');

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        setPreview(data.thumbnailUrl);
        onUploaded(data.thumbnailUrl);
        setProgress(100);
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          setUploadError(data.error ?? 'Upload fallito.');
        } catch {
          setUploadError('Upload fallito.');
        }
        setPreview(currentUrl ?? '');
      }
      setUploading(false);
    };

    xhr.onerror = () => {
      setUploadError('Errore di rete durante l\'upload.');
      setPreview(currentUrl ?? '');
      setUploading(false);
    };

    xhr.send(formData);
  }

  return (
    <div className="space-y-2">
      <label className="block text-[0.78rem] font-medium text-text-secondary">
        Immagine di copertina
      </label>
      <p className="text-[0.7rem] text-text-muted">
        Formato consigliato: 800×800px (quadrata). JPG, PNG, WebP — Max 5 MB.
      </p>

      {uploadError && (
        <p className="text-[0.72rem] text-accent-rose">{uploadError}</p>
      )}

      <label className={cn(
        'relative block w-full aspect-square max-w-[280px] rounded-xl border-2 border-dashed overflow-hidden cursor-pointer transition-colors',
        preview
          ? 'border-border-subtle hover:border-accent-cyan/40'
          : 'border-border-hover hover:border-accent-cyan/40 bg-surface-2/50',
        uploading && 'pointer-events-none opacity-70',
      )}>
        {preview ? (
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-text-muted p-4">
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-[0.78rem] text-center">Clicca per caricare</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-surface-0/80 flex flex-col items-center justify-center gap-2 p-4">
            <div className="w-3/4 h-2 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-cyan transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[0.72rem] text-text-muted">{progress}%</span>
          </div>
        )}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {preview && !uploading && (
        <label className="cursor-pointer text-[0.78rem] text-accent-cyan hover:underline">
          Sostituisci immagine
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}

/* ── Main form ── */

export function SimulationEditForm({ simulation }: SimulationEditFormProps) {
  const router = useRouter();
  const accent = ACCENT_TIPO[simulation.tipo];

  const [descrizione, setDescrizione] = useState(simulation.descrizione ?? '');
  const [comingSoon, setComingSoon] = useState(simulation.comingSoon);
  const [thumbnailUrl, setThumbnailUrl] = useState(simulation.thumbnailUrl ?? '');
  const [pathId, setPathId] = useState(simulation.pathId ?? '');
  const [paths, setPaths] = useState<PathOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  // Fetch lista percorsi per il dropdown
  useEffect(() => {
    fetch('/api/admin/learning-paths')
      .then((r) => r.json())
      .then((data: { paths?: { id: string; title: string }[] }) => {
        setPaths(data.paths ?? []);
      })
      .catch(() => { /* silenzioso */ });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/simulations/${simulation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descrizione: descrizione.trim() || undefined,
          thumbnailUrl: thumbnailUrl || undefined,
          comingSoon,
          pathId: pathId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error ?? 'Errore durante il salvataggio.');
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setSaveError('Errore di rete.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Info card — read-only */}
      <div
        className="rounded-xl border p-5 space-y-1"
        style={{ borderColor: `${accent}25`, background: `${accent}06` }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.62rem] font-bold uppercase tracking-wider border"
            style={{ color: accent, background: `${accent}15`, borderColor: `${accent}35` }}
          >
            {simulation.tipo === 'scritto'
              ? `Scritto · ${simulation.domande ?? 30} domande`
              : 'Pratico · Esercitazione'}
          </span>
          <span className="text-[0.72rem] text-text-muted">{simulation.durataMin} min</span>
        </div>
        <h2 className="font-heading text-xl font-bold text-text-primary">{simulation.figura}</h2>
        <p className="text-[0.72rem] text-text-muted font-mono">{simulation.slug}</p>
      </div>

      {/* Thumbnail */}
      <SimulationThumbnailUploader
        simId={simulation.id}
        currentUrl={thumbnailUrl || null}
        onUploaded={(url) => setThumbnailUrl(url)}
      />

      {/* Descrizione */}
      <div className="space-y-2">
        <label htmlFor="descrizione" className="block text-[0.78rem] font-medium text-text-secondary">
          Descrizione
        </label>
        <textarea
          id="descrizione"
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
          rows={3}
          maxLength={200}
          placeholder="Breve descrizione della simulazione (max 200 caratteri)…"
          className="w-full px-3.5 py-2.5 rounded-lg bg-surface-1 border border-border-subtle text-[0.84rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 resize-none transition-colors"
        />
        <p className="text-[0.68rem] text-text-muted text-right">{descrizione.length}/200</p>
      </div>

      {/* Percorso associato */}
      <div className="space-y-2">
        <label htmlFor="pathId" className="block text-[0.78rem] font-medium text-text-secondary">
          Percorso associato
        </label>
        <p className="text-[0.7rem] text-text-muted">
          La simulazione sarà sbloccata per chi ha acquistato questo percorso.
        </p>
        <select
          id="pathId"
          value={pathId}
          onChange={(e) => setPathId(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg bg-surface-1 border border-border-subtle text-[0.84rem] text-text-primary focus:outline-none focus:border-accent-cyan/50 transition-colors"
        >
          <option value="">— Nessun percorso (accesso libero) —</option>
          {paths.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {/* Toggle disponibilità */}
      <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-1/40 px-5 py-4">
        <div>
          <p className="text-[0.84rem] font-medium text-text-primary">Simulazione disponibile</p>
          <p className="text-[0.72rem] text-text-muted mt-0.5">
            Se disattivo, la card mostra il badge &ldquo;In arrivo&rdquo; ed è non cliccabile.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setComingSoon((v) => !v)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-0',
            !comingSoon ? 'bg-accent-emerald/80 focus:ring-accent-emerald' : 'bg-surface-3 focus:ring-border-hover',
          )}
          aria-checked={!comingSoon}
          role="switch"
        >
          <span
            className={cn(
              'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
              !comingSoon ? 'translate-x-6' : 'translate-x-1',
            )}
          />
        </button>
      </div>

      {/* Errors / success */}
      {saveError && (
        <p className="text-[0.78rem] text-accent-rose">{saveError}</p>
      )}
      {saved && (
        <p className="text-[0.78rem] text-accent-emerald">Modifiche salvate.</p>
      )}

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[0.85rem] font-bold transition-all duration-200',
            'bg-accent-cyan text-brand-dark hover:brightness-110 active:scale-95',
            saving && 'opacity-60 cursor-not-allowed',
          )}
        >
          {saving ? (
            <>
              <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Salvataggio…
            </>
          ) : 'Salva modifiche'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/admin/simulazioni')}
          className="text-[0.82rem] text-text-muted hover:text-text-primary transition-colors"
        >
          ← Torna alla lista
        </button>
      </div>
    </div>
  );
}
