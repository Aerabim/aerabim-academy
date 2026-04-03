'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface PreviewVideoUploaderProps {
  courseId: string;
  currentPlaybackId: string | null;
  onUploaded: (playbackId: string, assetId: string) => void;
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export function PreviewVideoUploader({
  courseId,
  currentPlaybackId,
  onUploaded,
}: PreviewVideoUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>(currentPlaybackId ? 'done' : 'idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [playbackId, setPlaybackId] = useState(currentPlaybackId);

  async function handleFile(file: File) {
    setError('');
    setState('uploading');
    setProgress(0);

    try {
      // 1. Get Mux Direct Upload URL
      const res = await fetch('/api/mux/preview-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Errore nel creare l\'upload.');
      }

      const { uploadUrl } = await res.json() as { uploadUrl: string; uploadId: string };

      // 2. PUT video directly to Mux
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload fallito: HTTP ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Errore di rete durante l\'upload.'));
        xhr.send(file);
      });

      // 3. Upload complete — Mux will process and webhook will update the DB.
      //    We can't know the playback ID until the webhook fires, so show "processing".
      setState('processing');

      // Poll the course until preview_playback_id is set (max 3 minutes)
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        if (attempts > 36) {
          clearInterval(poll);
          setState('error');
          setError('Timeout: il video preview impiega troppo tempo. Riprova più tardi.');
          return;
        }

        try {
          const pollRes = await fetch(`/api/admin/courses/${courseId}/preview-status`);
          if (!pollRes.ok) return;
          const pollData = await pollRes.json() as { previewPlaybackId: string | null; previewAssetId: string | null };

          if (pollData.previewPlaybackId) {
            clearInterval(poll);
            setPlaybackId(pollData.previewPlaybackId);
            onUploaded(pollData.previewPlaybackId, pollData.previewAssetId ?? '');
            setState('done');
          }
        } catch {
          // ignore polling errors
        }
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'upload.');
      setState('error');
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  const previewUrl = playbackId
    ? `https://stream.mux.com/${playbackId}/medium.mp4`
    : null;

  return (
    <div className="space-y-3">
      <label className="block text-[0.78rem] font-medium text-text-secondary">
        Video anteprima (clip breve · max 60s)
      </label>

      {error && (
        <div className="text-[0.72rem] text-accent-rose">{error}</div>
      )}

      {/* Video preview or drop zone */}
      <div
        onClick={() => state === 'idle' || state === 'error' ? fileRef.current?.click() : undefined}
        className={cn(
          'relative w-full rounded-lg border-2 border-dashed overflow-hidden transition-colors',
          state === 'idle' || state === 'error'
            ? 'h-32 cursor-pointer border-border-hover hover:border-accent-cyan/40 bg-surface-2/50'
            : 'border-border-subtle',
          (state === 'uploading' || state === 'processing') && 'pointer-events-none opacity-70',
        )}
      >
        {state === 'done' && previewUrl && (
          <video
            src={previewUrl}
            controls
            className="w-full max-h-48 object-cover rounded-lg"
            preload="metadata"
          />
        )}

        {(state === 'idle' || state === 'error') && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-text-muted">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <span className="text-[0.78rem]">Clicca per caricare un video breve</span>
            <span className="text-[0.68rem]">MP4, MOV — Max 60s consigliati</span>
          </div>
        )}

        {state === 'uploading' && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <div className="w-3/4 h-2 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-cyan transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[0.72rem] text-text-muted">Caricamento {progress}%</span>
          </div>
        )}

        {state === 'processing' && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-text-muted">
            <div className="w-6 h-6 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
            <span className="text-[0.72rem]">Elaborazione in corso...</span>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        onChange={handleFileChange}
        className="hidden"
      />

      {state === 'done' && (
        <button
          type="button"
          onClick={() => { setState('idle'); setPlaybackId(null); fileRef.current?.click(); }}
          className="text-[0.78rem] text-accent-cyan hover:underline"
        >
          Sostituisci video anteprima
        </button>
      )}
    </div>
  );
}
