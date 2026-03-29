'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface VideoUploaderProps {
  courseId: string;
  lessonId: string;
  currentStatus: string;
  currentPlaybackId: string | null;
  currentDurationSec: number | null;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function VideoUploader({
  courseId,
  lessonId,
  currentStatus,
  currentPlaybackId,
  currentDurationSec,
}: VideoUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(currentStatus);
  const [playbackId, setPlaybackId] = useState(currentPlaybackId);
  const [durationSec, setDurationSec] = useState(currentDurationSec);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const hasVideo = status === 'ready' && playbackId;

  async function handleUpload(file: File) {
    setError('');
    setUploading(true);
    setProgress(0);

    try {
      // 1. Get Mux upload URL
      const urlRes = await fetch('/api/mux/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, courseId }),
      });

      if (!urlRes.ok) {
        const data = await urlRes.json();
        throw new Error(data.error ?? 'Errore nel generare URL upload.');
      }

      const { uploadUrl, uploadId: newUploadId } = await urlRes.json();
      setUploadId(newUploadId);

      // 2. Upload file directly to Mux via PUT
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Persist preparing status to DB so it survives page reload
          try {
            await fetch(`/api/admin/courses/${courseId}/lessons/${lessonId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ muxStatus: 'preparing' }),
            });
          } catch {
            // Non-critical: check-status will eventually set the correct status
          }
          setStatus('preparing');
          setPlaybackId(null);
          setDurationSec(null);
          setProgress(100);
        } else {
          setError('Upload fallito. Riprova.');
        }
        setUploading(false);
      };

      xhr.onerror = () => {
        setError('Errore di rete durante l\'upload.');
        setUploading(false);
      };

      xhr.send(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'upload.');
      setUploading(false);
    }
  }

  async function handleCheckStatus() {
    setChecking(true);
    setError('');

    try {
      const res = await fetch('/api/mux/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, uploadId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Errore verifica stato.');
      }

      const data = await res.json();
      setStatus(data.status);
      if (data.playbackId) setPlaybackId(data.playbackId);
      if (data.durationSec != null) setDurationSec(data.durationSec);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la verifica.');
    } finally {
      setChecking(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    setError('');

    try {
      const res = await fetch('/api/mux/delete-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Errore durante la rimozione.');
      }

      setStatus('waiting');
      setPlaybackId(null);
      setDurationSec(null);
      setConfirmRemove(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la rimozione.');
    } finally {
      setRemoving(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  return (
    <div className="space-y-3">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <span className="text-[0.78rem] font-medium text-text-secondary">Video</span>
        {status === 'ready' && (
          <span className="text-[0.72rem] font-medium text-accent-emerald">Video pronto</span>
        )}
        {status === 'preparing' && (
          <span className="text-[0.72rem] font-medium text-accent-amber">Video in elaborazione...</span>
        )}
        {status === 'errored' && (
          <span className="text-[0.72rem] font-medium text-accent-rose">Errore elaborazione</span>
        )}
        {(!status || status === 'waiting') && (
          <span className="text-[0.72rem] font-medium text-text-muted">Nessun video caricato</span>
        )}
      </div>

      {/* Existing video info */}
      {hasVideo && (
        <div className="flex items-center gap-3 px-3 py-2.5 bg-accent-emerald/5 border border-accent-emerald/15 rounded-md">
          <div className="flex items-center justify-center w-8 h-8 bg-accent-emerald/10 rounded shrink-0">
            <svg className="w-4 h-4 text-accent-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.78rem] font-medium text-text-primary">Video associato</p>
            <p className="text-[0.68rem] text-text-muted truncate">
              ID: {playbackId}
              {durationSec != null && durationSec > 0 && (
                <> &middot; Durata: {formatDuration(durationSec)}</>
              )}
            </p>
          </div>
          {!confirmRemove ? (
            <button
              onClick={() => setConfirmRemove(true)}
              className="text-[0.68rem] text-text-muted hover:text-accent-rose transition-colors shrink-0"
            >
              Rimuovi
            </button>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleRemove}
                disabled={removing}
                className="text-[0.68rem] font-medium text-accent-rose hover:underline disabled:opacity-50"
              >
                {removing ? '...' : 'Conferma'}
              </button>
              <button
                onClick={() => setConfirmRemove(false)}
                className="text-[0.68rem] text-text-muted hover:text-text-secondary"
              >
                Annulla
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-[0.72rem] text-accent-rose">{error}</div>
      )}

      {uploading && (
        <div className="space-y-1">
          <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-cyan transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-[0.68rem] text-text-muted text-right">{progress}%</div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={cn(
            'px-3 py-1.5 text-[0.78rem] font-medium rounded-md transition-colors disabled:opacity-50',
            hasVideo
              ? 'bg-surface-3 text-text-muted hover:bg-surface-4 hover:text-text-secondary'
              : 'bg-surface-3 text-text-secondary hover:bg-surface-4 hover:text-text-primary',
          )}
        >
          {uploading ? 'Upload in corso...' : hasVideo ? 'Sostituisci video' : 'Carica video'}
        </button>

        {status === 'preparing' && (
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="px-3 py-1.5 bg-accent-amber/10 text-accent-amber text-[0.78rem] font-medium rounded-md border border-accent-amber/20 hover:bg-accent-amber/20 transition-colors disabled:opacity-50"
          >
            {checking ? 'Verifica...' : 'Verifica stato'}
          </button>
        )}
      </div>
    </div>
  );
}
