'use client';

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ThumbnailUploaderProps {
  courseId?: string;
  currentUrl: string;
  onUploaded: (url: string) => void;
  variant?: 'cover' | 'expanded' | 'landscape';
  label?: string;
  hint?: string;
  /** Only used in landscape variant — CSS object-position value e.g. "50% 30%" */
  currentPosition?: string;
  onPositionChange?: (position: string) => void;
}

export function ThumbnailUploader({ courseId, currentUrl, onUploaded, variant = 'cover', label, hint, currentPosition, onPositionChange }: ThumbnailUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(currentUrl);
  const [error, setError] = useState('');

  // Drag-to-reposition state (landscape variant only)
  const [position, setPosition] = useState(currentPosition ?? '50% 50%');
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (variant !== 'landscape' || !preview || uploading) return;
    e.preventDefault();
    const [px, py] = position.split(' ').map((v) => parseFloat(v));
    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, posX: px, posY: py };
    setIsDragging(true);

    let lastPos = position;

    function onMove(ev: MouseEvent) {
      if (!dragStartRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - dragStartRef.current.mouseX) / rect.width) * 100;
      const dy = ((ev.clientY - dragStartRef.current.mouseY) / rect.height) * 100;
      const newX = Math.round(Math.max(0, Math.min(100, dragStartRef.current.posX - dx)));
      const newY = Math.round(Math.max(0, Math.min(100, dragStartRef.current.posY - dy)));
      lastPos = `${newX}% ${newY}%`;
      setPosition(lastPos);
    }

    function onUp() {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      onPositionChange?.(lastPos);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [variant, preview, uploading, position, onPositionChange]);

  async function handleUpload(file: File) {
    setError('');
    setUploading(true);
    setProgress(0);

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (courseId) formData.append('courseId', courseId);
      formData.append('variant', variant);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/courses/upload-thumbnail');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
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
            setError(data.error ?? 'Upload fallito.');
          } catch {
            setError('Upload fallito.');
          }
          setPreview(currentUrl);
        }
        setUploading(false);
      };

      xhr.onerror = () => {
        setError('Errore di rete durante l\'upload.');
        setPreview(currentUrl);
        setUploading(false);
      };

      xhr.send(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'upload.');
      setPreview(currentUrl);
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[0.78rem] font-medium text-text-secondary">
          {label ?? 'Immagine di copertina'}
        </label>
        {hint && <p className="text-[0.7rem] text-text-muted mt-0.5">{hint}</p>}
      </div>

      {error && (
        <div className="text-[0.72rem] text-accent-rose">{error}</div>
      )}

      {/* Preview */}
      <div
        ref={containerRef}
        onClick={() => variant !== 'landscape' && !uploading && fileRef.current?.click()}
        onMouseDown={variant === 'landscape' && preview && !uploading ? handleDragStart : undefined}
        className={cn(
          'relative w-full rounded-lg border-2 border-dashed overflow-hidden transition-all duration-300',
          variant === 'expanded' ? 'aspect-video' :
          variant === 'landscape' ? 'h-[220px]' :
          'aspect-[3/4]',
          variant === 'landscape' && preview ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer',
          preview
            ? 'border-border-subtle hover:border-accent-cyan/40'
            : 'border-border-hover hover:border-accent-cyan/40 bg-surface-2/50',
          uploading && 'pointer-events-none opacity-70',
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Copertina corso"
            className="w-full h-full object-cover transition-none"
            style={variant === 'landscape' ? { objectPosition: position } : undefined}
          />
        ) : null}

        {/* Drag hint overlay (landscape only) */}
        {variant === 'landscape' && preview && !uploading && !isDragging && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-[0.65rem] text-white/70 pointer-events-none select-none">
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M12 12v.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Trascina per riposizionare
          </div>
        )}

        {!preview && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-text-muted">
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-[0.78rem]">Clicca per caricare un&apos;immagine</span>
            <span className="text-[0.68rem]">JPG, PNG, WebP — Max 5 MB</span>
          </div>
        )}

        {/* Upload overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-surface-0/80 flex flex-col items-center justify-center gap-2">
            <div className="w-3/4 h-2 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-cyan transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[0.72rem] text-text-muted">{progress}%</span>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview && !uploading && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-[0.78rem] text-accent-cyan hover:underline"
        >
          Sostituisci immagine
        </button>
      )}
    </div>
  );
}
