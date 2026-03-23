'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface VideoUploaderProps {
  courseId: string;
  lessonId: string;
  currentStatus: string;
}

export function VideoUploader({ courseId, lessonId, currentStatus }: VideoUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState('');

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

      const { uploadUrl } = await urlRes.json();

      // 2. Upload file directly to Mux via PUT
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setStatus('preparing');
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  const statusDisplay: Record<string, { label: string; color: string }> = {
    waiting: { label: 'Nessun video caricato', color: 'text-text-muted' },
    preparing: { label: 'Video in elaborazione...', color: 'text-accent-amber' },
    ready: { label: 'Video pronto', color: 'text-accent-emerald' },
    errored: { label: 'Errore elaborazione', color: 'text-accent-rose' },
  };

  const currentDisplay = statusDisplay[status] ?? statusDisplay.waiting;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[0.78rem] font-medium text-text-secondary">Video</span>
        <span className={cn('text-[0.72rem] font-medium', currentDisplay.color)}>
          {currentDisplay.label}
        </span>
      </div>

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

      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="px-3 py-1.5 bg-surface-3 text-text-secondary text-[0.78rem] font-medium rounded-md hover:bg-surface-4 hover:text-text-primary transition-colors disabled:opacity-50"
      >
        {uploading ? 'Upload in corso...' : status === 'ready' ? 'Sostituisci video' : 'Carica video'}
      </button>
    </div>
  );
}
