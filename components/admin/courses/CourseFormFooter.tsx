'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCourseTabsContext } from './CourseNavTabs';
import type { CourseStatus } from '@/types';

const STATUS_OPTIONS: { value: CourseStatus; label: string; dotClass: string; textClass: string }[] = [
  { value: 'draft',     label: 'Bozza',      dotClass: 'bg-text-muted',      textClass: 'text-text-muted' },
  { value: 'hidden',    label: 'Nascosto',    dotClass: 'bg-accent-amber',    textClass: 'text-accent-amber' },
  { value: 'published', label: 'Pubblicato',  dotClass: 'bg-accent-emerald',  textClass: 'text-accent-emerald' },
  { value: 'private',   label: 'Privato',     dotClass: 'bg-accent-violet',   textClass: 'text-accent-violet' },
  { value: 'archived',  label: 'Archiviato',  dotClass: 'bg-accent-rose',     textClass: 'text-accent-rose' },
];

interface CourseFormFooterProps {
  formId?: string;
  isEditing: boolean;
  courseId?: string;
  currentStatus?: CourseStatus;
}

export function CourseFormFooter({ formId = 'course-form', isEditing, courseId, currentStatus }: CourseFormFooterProps) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState<CourseStatus>(currentStatus ?? 'draft');
  const [changingStatus, setChangingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<'saved' | 'error' | null>(null);
  const { isDirty, isSaving } = useCourseTabsContext();

  useEffect(() => {
    function handleSaved() {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    window.addEventListener('course-saved', handleSaved);
    return () => window.removeEventListener('course-saved', handleSaved);
  }, []);

  async function handleStatusChange(newStatus: CourseStatus) {
    if (!courseId || newStatus === status) return;
    setChangingStatus(true);
    setStatusFeedback(null);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        setStatusFeedback('saved');
        setTimeout(() => setStatusFeedback(null), 3000);
        router.refresh();
      } else {
        setStatusFeedback('error');
        setTimeout(() => setStatusFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Change status error:', err);
      setStatusFeedback('error');
      setTimeout(() => setStatusFeedback(null), 4000);
    } finally {
      setChangingStatus(false);
    }
  }

  const currentOpt = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0];

  return (
    <>
      <div className="h-16" />
      <div className="sticky bottom-0 z-30 -mx-6 lg:-mx-10 border-t border-border-subtle bg-surface-1/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-6 lg:px-10 py-3">
          <button
            type="submit"
            form={formId}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-cyan/15 text-accent-cyan text-[0.82rem] font-semibold rounded-md border border-accent-cyan/20 hover:bg-accent-cyan/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving && (
              <svg className="animate-spin" width="13" height="13" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {isSaving ? 'Salvataggio…' : isEditing ? 'Salva modifiche' : 'Crea corso'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (isDirty && !window.confirm('Hai modifiche non salvate. Vuoi uscire comunque?')) return;
              router.push('/admin/corsi');
              router.refresh();
            }}
            className="px-5 py-2.5 text-[0.82rem] font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Chiudi
          </button>

          {isEditing && courseId && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[0.72rem] text-text-muted">Stato:</span>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value as CourseStatus)}
                  disabled={changingStatus}
                  className={cn(
                    'appearance-none pl-6 pr-7 py-1.5 rounded-md text-[0.78rem] font-semibold border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                    'bg-surface-2 border-border-subtle focus:outline-none focus:border-accent-cyan/40',
                    currentOpt.textClass,
                  )}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="text-text-primary bg-surface-2">
                      {opt.label}
                    </option>
                  ))}
                </select>
                {changingStatus ? (
                  <svg className="animate-spin absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <span className={cn('absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none', currentOpt.dotClass)} />
                )}
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              {statusFeedback === 'saved' && (
                <span className="text-[0.72rem] font-medium text-accent-emerald">Stato aggiornato.</span>
              )}
              {statusFeedback === 'error' && (
                <span className="text-[0.72rem] font-medium text-accent-rose">Errore aggiornamento.</span>
              )}
            </div>
          )}

          {success && (
            <span className={cn('text-[0.78rem] font-medium text-accent-emerald', isEditing && courseId ? '' : 'ml-2')}>
              Modifiche salvate con successo.
            </span>
          )}
        </div>
      </div>
    </>
  );
}
