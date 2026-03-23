'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface MaterialUploaderProps {
  courseId: string;
  lessonId: string;
  currentUrl: string | null;
}

export function MaterialUploader({ courseId, lessonId, currentUrl }: MaterialUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState(currentUrl);
  const [error, setError] = useState('');

  async function handleUpload(file: File) {
    setError('');
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/admin/courses/${courseId}/lessons/${lessonId}/upload-material`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          setUrl(data.materialUrl);
          setProgress(100);
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            setError(data.error ?? 'Upload fallito.');
          } catch {
            setError('Upload fallito.');
          }
        }
        setUploading(false);
      };

      xhr.onerror = () => {
        setError('Errore di rete durante l\'upload.');
        setUploading(false);
      };

      xhr.send(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'upload.');
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  function getFileName(fileUrl: string): string {
    const parts = fileUrl.split('/');
    return parts[parts.length - 1] ?? 'file';
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[0.78rem] font-medium text-text-secondary">Materiale didattico</span>
        <span className={cn(
          'text-[0.72rem] font-medium',
          url ? 'text-accent-emerald' : 'text-text-muted',
        )}>
          {url ? 'File caricato' : 'Nessun file caricato'}
        </span>
      </div>

      {error && (
        <div className="text-[0.72rem] text-accent-rose">{error}</div>
      )}

      {url && !uploading && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[0.78rem] text-accent-cyan hover:underline"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
          {getFileName(url)}
        </a>
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
        accept=".pdf,.pptx,.xlsx,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="px-3 py-1.5 bg-surface-3 text-text-secondary text-[0.78rem] font-medium rounded-md hover:bg-surface-4 hover:text-text-primary transition-colors disabled:opacity-50"
      >
        {uploading ? 'Upload in corso...' : url ? 'Sostituisci file' : 'Carica file'}
      </button>

      <div className="text-[0.68rem] text-text-muted">
        Formati: PDF, PPTX, XLSX, DOCX — Max 50 MB
      </div>
    </div>
  );
}
