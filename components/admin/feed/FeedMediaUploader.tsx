'use client';

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

type MediaType = 'image' | 'video';

interface FeedMediaUploaderProps {
  postId: string;
  onComplete: (mediaType: MediaType, mediaUrl: string) => void;
  onClear: () => void;
  currentType: MediaType | null;
  currentUrl: string | null;
}

/* ── Image uploader ── */
function ImageUploader({
  postId,
  onComplete,
}: {
  postId: string;
  onComplete: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      void postId; // postId not needed for image — URL is returned directly

      const res = await fetch('/api/admin/feed/posts/upload-image', { method: 'POST', body: form });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Errore upload.');
        return;
      }
      onComplete(data.url);
    } catch {
      setError('Errore di rete.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          'w-full flex items-center justify-center gap-2 border-2 border-dashed border-border-subtle rounded-lg py-6',
          'text-[0.78rem] text-text-muted hover:border-accent-cyan/40 hover:text-text-secondary transition-colors',
          'disabled:opacity-50',
        )}
      >
        {uploading ? (
          <>
            <svg className="animate-spin" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Caricamento...
          </>
        ) : (
          <>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Clicca per caricare un&apos;immagine (JPG, PNG, WebP · max 10 MB)
          </>
        )}
      </button>
      {error && <p className="text-[0.72rem] text-accent-rose">{error}</p>}
    </div>
  );
}

/* ── Video uploader (Mux Direct Upload) ── */
function VideoUploader({
  postId,
  onComplete,
}: {
  postId: string;
  onComplete: (playbackId: string) => void;
}) {
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pollStatus = useCallback(() => {
    pollRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/feed/posts/${postId}/video-status`);
        const data = await res.json() as { ready: boolean; playbackId: string | null };
        if (data.ready && data.playbackId) {
          setPhase('done');
          onComplete(data.playbackId);
        } else {
          pollStatus();
        }
      } catch {
        pollStatus();
      }
    }, 5000);
  }, [postId, onComplete]);

  async function handleFile(file: File) {
    setErrorMsg('');
    setPhase('uploading');
    setProgress(0);

    try {
      // 1. Get Mux Direct Upload URL
      const initRes = await fetch('/api/admin/feed/posts/feed-video-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      const initData = await initRes.json() as { uploadUrl?: string; error?: string };
      if (!initRes.ok || !initData.uploadUrl) {
        setPhase('error');
        setErrorMsg(initData.error ?? 'Errore inizializzazione upload.');
        return;
      }

      // 2. Upload directly to Mux
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        });
        xhr.addEventListener('error', () => reject(new Error('Errore di rete')));
        xhr.open('PUT', initData.uploadUrl!);
        xhr.send(file);
      });

      // 3. Poll for Mux processing
      setPhase('processing');
      pollStatus();
    } catch (err) {
      setPhase('error');
      setErrorMsg(err instanceof Error ? err.message : 'Errore durante l\'upload.');
    }
  }

  if (phase === 'done') {
    return (
      <div className="flex items-center gap-2 text-[0.78rem] text-accent-emerald py-3">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Video pronto per la pubblicazione.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {phase === 'idle' && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'w-full flex items-center justify-center gap-2 border-2 border-dashed border-border-subtle rounded-lg py-6',
            'text-[0.78rem] text-text-muted hover:border-accent-cyan/40 hover:text-text-secondary transition-colors',
          )}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          Clicca per caricare un video (MP4, MOV, WebM)
        </button>
      )}

      {phase === 'uploading' && (
        <div className="space-y-2 py-2">
          <div className="flex items-center justify-between text-[0.72rem] text-text-muted">
            <span>Caricamento...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-cyan rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {phase === 'processing' && (
        <div className="flex items-center gap-2 text-[0.78rem] text-text-muted py-3">
          <svg className="animate-spin" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          Elaborazione video in corso (può richiedere qualche minuto)...
        </div>
      )}

      {phase === 'error' && (
        <div className="space-y-2">
          <p className="text-[0.72rem] text-accent-rose">{errorMsg}</p>
          <button type="button" onClick={() => setPhase('idle')} className="text-[0.72rem] text-accent-cyan hover:underline">
            Riprova
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main component ── */
export function FeedMediaUploader({ postId, onComplete, onClear, currentType, currentUrl }: FeedMediaUploaderProps) {
  const [selected, setSelected] = useState<MediaType | null>(currentType);

  function handleTypeSelect(type: MediaType) {
    setSelected(type);
    onClear();
  }

  function handleClear() {
    setSelected(null);
    onClear();
  }

  // If already has media, show preview + clear button
  if (currentType && currentUrl) {
    return (
      <div className="space-y-2">
        <div className="relative rounded-lg overflow-hidden bg-surface-3 aspect-video">
          {currentType === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUrl} alt="Media preview" className="w-full h-full object-cover" />
          ) : (
            <video
              src={`https://stream.mux.com/${currentUrl}/medium.mp4`}
              muted
              loop
              playsInline
              autoPlay
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-[0.72rem] text-accent-rose hover:underline"
        >
          Rimuovi media
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Type selector */}
      <div className="flex items-center gap-2">
        {(['image', 'video'] as MediaType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleTypeSelect(type)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[0.76rem] font-medium border transition-colors',
              selected === type
                ? 'bg-accent-cyan/10 border-accent-cyan/40 text-accent-cyan'
                : 'border-border-subtle text-text-muted hover:text-text-secondary hover:border-border-subtle/80',
            )}
          >
            {type === 'image' ? (
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
              </svg>
            ) : (
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
            )}
            {type === 'image' ? 'Immagine' : 'Video'}
          </button>
        ))}
        {selected && (
          <button type="button" onClick={handleClear} className="ml-auto text-[0.72rem] text-text-muted hover:text-text-primary">
            Annulla
          </button>
        )}
      </div>

      {/* Uploader */}
      {selected === 'image' && (
        <ImageUploader postId={postId} onComplete={(url) => onComplete('image', url)} />
      )}
      {selected === 'video' && (
        <VideoUploader postId={postId} onComplete={(pid) => onComplete('video', pid)} />
      )}
    </div>
  );
}
