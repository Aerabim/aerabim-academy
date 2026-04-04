'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { AREA_CONFIG, LEVEL_LABELS } from '@/lib/area-config';
import type { CourseStatus, AreaCode, LevelCode } from '@/types';

interface PickableCourse {
  id: string;
  title: string;
  slug: string;
  status: CourseStatus;
  thumbnail_url: string | null;
  area: AreaCode;
  level: LevelCode;
}

interface CoursePickerModalProps {
  open: boolean;
  /** IDs already in the path — greyed out and non-selectable */
  excludedCourseIds: string[];
  onSelect: (course: PickableCourse) => void;
  onClose: () => void;
}

const STATUS_LABEL: Record<CourseStatus, string> = {
  published: 'Pubblicato',
  draft:     'Bozza',
  hidden:    'Nascosto',
  archived:  'Archiviato',
};

const STATUS_CLASS: Record<CourseStatus, string> = {
  published: 'text-accent-emerald bg-accent-emerald/10 border-accent-emerald/20',
  draft:     'text-text-muted bg-surface-3 border-border-subtle',
  hidden:    'text-accent-amber bg-accent-amber/10 border-accent-amber/20',
  archived:  'text-accent-rose bg-accent-rose/10 border-accent-rose/20',
};

export function CoursePickerModal({
  open,
  excludedCourseIds,
  onSelect,
  onClose,
}: CoursePickerModalProps) {
  const [courses, setCourses] = useState<PickableCourse[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    setFilter('');
    setLoading(true);

    fetch('/api/admin/courses?fields=id,title,slug,status,thumbnail_url,area,level&limit=200')
      .then((r) => r.json())
      .then((json: { courses?: PickableCourse[] }) => {
        setCourses(json.courses ?? []);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));

    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(filter.toLowerCase()),
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 bg-surface-1 border border-border-subtle rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
          <h3 className="text-[0.92rem] font-semibold text-text-primary">Seleziona un corso</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-border-subtle shrink-0">
          <input
            ref={inputRef}
            type="text"
            placeholder="Cerca per titolo..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-3 py-2 text-[0.82rem] bg-surface-2 border border-border-subtle rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
          />
        </div>

        {/* Course list */}
        <div className="overflow-y-auto flex-1 px-3 py-2">
          {loading ? (
            <div className="text-center py-8 text-text-muted text-[0.82rem]">Caricamento...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-[0.82rem]">Nessun corso trovato.</div>
          ) : (
            filtered.map((course) => {
              const excluded = excludedCourseIds.includes(course.id);
              return (
                <button
                  key={course.id}
                  disabled={excluded}
                  onClick={() => { onSelect(course); onClose(); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors mb-1',
                    excluded
                      ? 'opacity-40 cursor-not-allowed bg-surface-2'
                      : 'hover:bg-surface-2 cursor-pointer',
                  )}
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded shrink-0 bg-surface-3 overflow-hidden">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">
                        {AREA_CONFIG[course.area]?.emoji ?? '📚'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.82rem] font-medium text-text-primary truncate">{course.title}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[0.68rem] text-text-muted">{LEVEL_LABELS[course.level]}</span>
                      <span className="text-text-muted/40">·</span>
                      <span className={cn(
                        'text-[0.68rem] font-semibold px-1.5 py-0.5 rounded border',
                        STATUS_CLASS[course.status],
                      )}>
                        {STATUS_LABEL[course.status]}
                      </span>
                    </div>
                  </div>

                  {excluded && (
                    <span className="text-[0.68rem] text-text-muted shrink-0">Già aggiunto</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
