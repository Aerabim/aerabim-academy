'use client';

import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { AREA_CONFIG } from '@/lib/area-config';
import { useState } from 'react';
import type { LearningPathStepDisplay, CourseStatus } from '@/types';

const STEP_TYPE_LABEL = { course: 'Corso', video: 'Video', material: 'Materiale' } as const;
const STEP_TYPE_CLASS = {
  course:   'text-accent-cyan   bg-accent-cyan/10   border-accent-cyan/20',
  video:    'text-accent-amber  bg-accent-amber/10  border-accent-amber/20',
  material: 'text-accent-violet bg-accent-violet/10 border-accent-violet/20',
} as const;

const COURSE_STATUS_CLASS: Record<CourseStatus, string> = {
  published: 'text-accent-emerald bg-accent-emerald/10 border-accent-emerald/20',
  draft:     'text-text-muted bg-surface-3 border-border-subtle',
  hidden:    'text-accent-amber bg-accent-amber/10 border-accent-amber/20',
  archived:  'text-accent-rose bg-accent-rose/10 border-accent-rose/20',
  private:   'text-accent-violet bg-accent-violet/10 border-accent-violet/20',
};
const COURSE_STATUS_LABEL: Record<CourseStatus, string> = {
  published: 'Pubblicato', draft: 'Bozza', hidden: 'Nascosto', archived: 'Archiviato', private: 'Privato',
};

interface StepCardProps {
  step: LearningPathStepDisplay;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => Promise<void>;
}

export function StepCard({ step, isFirst, isLast, onMoveUp, onMoveDown, onDelete }: StepCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    setConfirmOpen(false);
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 bg-surface-2 border border-border-subtle rounded-lg">
        {/* Order badge */}
        <div className="w-7 h-7 rounded-md bg-surface-3 flex items-center justify-center text-[0.7rem] font-bold text-text-muted shrink-0">
          {step.orderNum}
        </div>

        {/* Type badge */}
        <span className={cn(
          'text-[0.68rem] font-semibold px-1.5 py-0.5 rounded border shrink-0',
          STEP_TYPE_CLASS[step.stepType],
        )}>
          {STEP_TYPE_LABEL[step.stepType]}
        </span>

        {/* Content info */}
        <div className="flex-1 min-w-0">
          {step.stepType === 'course' && (
            <div className="flex items-center gap-2 min-w-0">
              {step.course.thumbnail_url ? (
                <img
                  src={step.course.thumbnail_url}
                  alt=""
                  className="w-8 h-8 rounded object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-surface-3 flex items-center justify-center shrink-0 text-base">
                  {AREA_CONFIG[step.course.area]?.emoji ?? '📚'}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[0.82rem] font-medium text-text-primary truncate">
                  {step.course.title}
                </div>
                <span className={cn(
                  'text-[0.66rem] font-semibold px-1.5 py-0.5 rounded border',
                  COURSE_STATUS_CLASS[step.course.status],
                )}>
                  {COURSE_STATUS_LABEL[step.course.status]}
                </span>
                {step.course.status !== 'published' && (
                  <span className="ml-1.5 text-[0.66rem] text-accent-amber">
                    ⚠ Corso non pubblicato
                  </span>
                )}
              </div>
            </div>
          )}

          {step.stepType === 'video' && (
            <div className="min-w-0">
              <div className="text-[0.82rem] font-medium text-text-primary truncate">
                {step.title ?? 'Video dedicato'}
              </div>
              {step.durationSec && (
                <div className="text-[0.7rem] text-text-muted">
                  {Math.floor(step.durationSec / 60)}min
                </div>
              )}
            </div>
          )}

          {step.stepType === 'material' && (
            <div className="min-w-0">
              <div className="text-[0.82rem] font-medium text-text-primary truncate">
                {step.title ?? step.materialUrl}
              </div>
              <div className="text-[0.7rem] text-text-muted uppercase tracking-wide">
                {step.materialType}
              </div>
            </div>
          )}
        </div>

        {/* Required badge */}
        <span className={cn(
          'text-[0.66rem] font-medium px-1.5 py-0.5 rounded border shrink-0',
          step.isRequired
            ? 'text-text-secondary bg-surface-3 border-border-subtle'
            : 'text-text-muted border-dashed border-border-subtle',
        )}>
          {step.isRequired ? 'Obbligatorio' : 'Opzionale'}
        </span>

        {/* Reorder + delete */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            title="Sposta su"
            className="p-1.5 rounded text-text-muted hover:text-text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            title="Sposta giù"
            className="p-1.5 rounded text-text-muted hover:text-text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            title="Rimuovi passo"
            className="p-1.5 rounded text-text-muted hover:text-accent-rose transition-colors"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Rimuovi passo"
        message="Rimuovere questo passo dal percorso? Il corso nel catalogo non verrà toccato."
        confirmLabel="Rimuovi"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
