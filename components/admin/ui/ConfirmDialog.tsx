'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  variant = 'default',
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} />
      <div
        ref={dialogRef}
        className="relative z-10 bg-surface-1 border border-border-subtle rounded-lg shadow-xl w-full max-w-md mx-4 animate-fadeIn"
      >
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-[0.95rem] font-semibold text-text-primary">
            {title}
          </h3>
          <p className="mt-2 text-[0.82rem] text-text-secondary leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2.5 px-5 pb-5 pt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-[0.8rem] font-medium text-text-secondary hover:text-text-primary bg-surface-2 border border-border-subtle rounded-md transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'px-4 py-2 text-[0.8rem] font-semibold rounded-md transition-colors',
              variant === 'danger'
                ? 'bg-accent-rose/15 text-accent-rose hover:bg-accent-rose/25 border border-accent-rose/20'
                : 'bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20',
              loading && 'opacity-50 cursor-not-allowed',
            )}
          >
            {loading ? 'Attendere...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
