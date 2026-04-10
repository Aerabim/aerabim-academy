'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { AREA_CONFIG } from '@/lib/area-config';
import type { LearningPathCourse, CourseStatus } from '@/types';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

const COURSE_STATUS_CLASS: Record<CourseStatus, string> = {
  published: 'text-accent-emerald bg-accent-emerald/10 border-accent-emerald/20',
  draft:     'text-text-muted bg-surface-3 border-border-subtle',
  hidden:    'text-accent-amber bg-accent-amber/10 border-accent-amber/20',
  archived:  'text-accent-rose bg-accent-rose/10 border-accent-rose/20',
  private:   'text-accent-violet bg-accent-violet/10 border-accent-violet/20',
  path:      'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20',
};
const COURSE_STATUS_LABEL: Record<CourseStatus, string> = {
  published: 'Pubblicato', draft: 'Bozza', hidden: 'Nascosto',
  archived: 'Archiviato', private: 'Privato', path: 'Percorso',
};

interface PathCourseCardProps {
  entry: LearningPathCourse;
  onDelete: () => Promise<void>;
  dragListeners?: SyntheticListenerMap;
  dragAttributes?: DraggableAttributes;
}

export function PathCourseCard({ entry, onDelete, dragListeners, dragAttributes }: PathCourseCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { course } = entry;
  const areaConf = AREA_CONFIG[course.area];

  async function handleDelete() {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    setConfirmOpen(false);
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 bg-surface-2 border border-border-subtle rounded-lg">

        {/* Drag handle */}
        <button
          type="button"
          {...dragListeners}
          {...dragAttributes}
          className="cursor-grab active:cursor-grabbing p-1 text-text-muted hover:text-text-secondary transition-colors touch-none shrink-0"
          title="Trascina per riordinare"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="3" cy="2" r="1.2" /><circle cx="3" cy="6" r="1.2" /><circle cx="3" cy="10" r="1.2" />
            <circle cx="8" cy="2" r="1.2" /><circle cx="8" cy="6" r="1.2" /><circle cx="8" cy="10" r="1.2" />
          </svg>
        </button>

        {/* Order badge */}
        <div className="w-6 h-6 rounded bg-surface-3 flex items-center justify-center text-[0.68rem] font-bold text-text-muted shrink-0">
          {entry.orderNum}
        </div>

        {/* Thumbnail / emoji */}
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded bg-surface-3 flex items-center justify-center shrink-0 text-lg">
            {areaConf?.emoji ?? '📚'}
          </div>
        )}

        {/* Title + badges */}
        <div className="flex-1 min-w-0">
          <div className="text-[0.82rem] font-medium text-text-primary truncate">{course.title}</div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={cn(
              'text-[0.64rem] font-semibold px-1.5 py-0.5 rounded border',
              COURSE_STATUS_CLASS[course.status],
            )}>
              {COURSE_STATUS_LABEL[course.status]}
            </span>
            {course.status !== 'published' && course.status !== 'path' && (
              <span className="text-[0.64rem] text-accent-amber">⚠ Corso non pubblicato</span>
            )}
            {course.level && (
              <span className="text-[0.64rem] text-text-muted bg-surface-3 px-1.5 py-0.5 rounded border border-border-subtle">
                {course.level}
              </span>
            )}
            {areaConf && (
              <span className="text-[0.64rem] text-text-muted">{areaConf.label}</span>
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => setConfirmOpen(true)}
          title="Rimuovi dal percorso"
          className="p-1.5 rounded text-text-muted hover:text-accent-rose transition-colors shrink-0"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Rimuovi corso"
        message={`Rimuovere "${course.title}" dal percorso? Il corso nel catalogo non verrà toccato.`}
        confirmLabel="Rimuovi"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
