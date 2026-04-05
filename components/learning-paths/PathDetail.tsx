'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AREA_CONFIG } from '@/lib/area-config';
import { cn } from '@/lib/utils';
import type {
  LearningPath,
  LearningPathStepDisplay,
  LearningPathProgressData,
  AreaCode,
} from '@/types';

interface PathDetailProps {
  path: LearningPath;
  steps: LearningPathStepDisplay[];
  /** courseId → true if user is enrolled */
  enrolledCourseIds: Set<string>;
}

const STEP_TYPE_ICON = {
  course:   '📚',
  video:    '🎬',
  material: '📄',
} as const;

export function PathDetail({ path, steps, enrolledCourseIds }: PathDetailProps) {
  const [progress, setProgress] = useState<LearningPathProgressData | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const sortedSteps = [...steps].sort((a, b) => a.orderNum - b.orderNum);

  useEffect(() => {
    fetch(`/api/learning-paths/${path.id}/progress`)
      .then((r) => r.json())
      .then((json: { progress?: LearningPathProgressData }) => {
        if (json.progress) setProgress(json.progress);
      })
      .catch(() => undefined);
  }, [path.id]);

  async function handleComplete(stepId: string) {
    setCompletingId(stepId);
    try {
      const res = await fetch(
        `/api/learning-paths/${path.id}/steps/${stepId}/complete`,
        { method: 'POST' },
      );
      const json = await res.json() as { isPathCompleted?: boolean };
      // Refresh progress
      const progressRes = await fetch(`/api/learning-paths/${path.id}/progress`);
      const progressJson = await progressRes.json() as { progress?: LearningPathProgressData };
      if (progressJson.progress) setProgress(progressJson.progress);
      if (json.isPathCompleted) {
        // Small celebration — could be extended with confetti
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      // Non-blocking
    } finally {
      setCompletingId(null);
    }
  }

  const completedIds = new Set(progress?.completedStepIds ?? []);
  const pct = progress?.percentage ?? 0;

  /* ── Animated counter: 0 → pct on data arrival ── */
  const [displayPct, setDisplayPct] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (pct === 0) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const duration = 900; // ms
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayPct(Math.round(from + (pct - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [pct]);

  /* ── Entrance animation ── */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const reveal = cn(
    'transition-[opacity,transform] duration-500 ease-out',
    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
  );
  const delay = (ms: number) => ({ style: { transitionDelay: `${ms}ms` } });

  /* ── Mouse tracking for header ── */
  const headerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const [headerHovered, setHeaderHovered] = useState(false);

  function handleHeaderMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <div className="space-y-8">
      {/* Header card */}
      <div
        ref={headerRef}
        className="relative overflow-hidden rounded-xl border border-[#4ECDC4]/15 min-h-[220px] lg:min-h-[240px] transition-[box-shadow] duration-300"
        style={{
          boxShadow: headerHovered
            ? '0 0 0 1px #4ECDC440, 0 12px 48px -12px #4ECDC428'
            : '0 0 0 1px transparent',
        }}
        onMouseMove={handleHeaderMouseMove}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
      >
        {/* Background */}
        {path.thumbnail_url ? (
          <>
            <img
              src={path.thumbnail_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out scale-[1.06]"
              style={{
                transform: `scale(1.06) translate(${(mouse.x - 50) * -0.06}%, ${(mouse.y - 50) * -0.06}%)`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#040B11]/95 via-[#040B11]/80 to-[#040B11]/50" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #040B11 0%, #0f1f2e 55%, #0a1520 100%)' }}
          />
        )}

        {/* Mouse-tracking radial glow */}
        <div
          className={cn(
            'absolute inset-0 pointer-events-none transition-opacity duration-300',
            headerHovered ? 'opacity-100' : 'opacity-0',
          )}
          style={{
            background: `radial-gradient(600px circle at ${mouse.x}% ${mouse.y}%, #4ECDC41a, transparent 65%)`,
          }}
        />

        {/* Static cyan glow — top-left */}
        <div className="pointer-events-none absolute -top-16 -left-16 h-52 w-52 rounded-full blur-3xl opacity-15"
          style={{ background: '#4ECDC4' }} />

        {/* Left accent bar */}
        <div
          className="absolute left-0 top-0 h-full transition-all duration-300"
          style={{
            width: headerHovered ? '5px' : '4px',
            background: 'linear-gradient(to bottom, #4ECDC4, #4ECDC480)',
            boxShadow: headerHovered ? '2px 0 12px 0 #4ECDC450' : 'none',
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(#4ECDC4 1px, transparent 1px),
              linear-gradient(90deg, #4ECDC4 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div className={cn(
          'relative p-8 lg:p-10 transition-transform duration-300',
          headerHovered && 'translate-x-0.5',
        )}>
          {/* Badges */}
          {path.estimated_hours && (
            <div {...delay(0)} className={cn(reveal, 'flex flex-wrap items-center gap-2 mb-4')}>
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[0.7rem] text-text-muted font-medium">
                ~{path.estimated_hours}h
              </span>
            </div>
          )}

          <h1 {...delay(80)} className={cn(reveal, 'font-heading text-2xl lg:text-[2rem] font-extrabold text-text-primary leading-tight mb-2')}>
            {path.title}
          </h1>

          {path.subtitle && (
            <p {...delay(160)} className={cn(reveal, 'text-text-secondary text-[0.88rem] leading-relaxed mb-6 max-w-xl')}>
              {path.subtitle}
            </p>
          )}

          {/* Progress */}
          <div {...delay(path.subtitle ? 240 : 160)} className={cn(reveal, 'space-y-2 max-w-sm')}>
            <div className="flex items-center justify-between text-[0.75rem]">
              <span className="text-text-muted">
                {progress
                  ? `${progress.completedRequiredSteps} / ${progress.totalRequiredSteps} passi obbligatori`
                  : `${sortedSteps.length} passi totali`}
              </span>
              <span className={cn(
                'font-semibold tabular-nums transition-colors duration-300',
                pct === 100 ? 'text-accent-emerald' : 'text-accent-cyan',
              )}>
                {displayPct}%
              </span>
            </div>
            <ProgressBar percentage={displayPct} color={pct === 100 ? 'emerald' : 'cyan'} className="h-1.5" />
            {pct === 100 && (
              <p className="text-[0.75rem] text-accent-emerald font-semibold">
                Percorso completato
              </p>
            )}
          </div>
        </div>{/* /content */}
      </div>

      {/* Description */}
      {path.description && (
        <p className="text-text-secondary text-[0.88rem] leading-relaxed">{path.description}</p>
      )}

      {/* Steps */}
      <div className="space-y-3">
        <h2 className="text-[0.88rem] font-semibold text-text-primary">
          Passi del percorso
        </h2>

        {sortedSteps.map((step, index) => {
          const isDone = completedIds.has(step.id);

          return (
            <div
              key={step.id}
              className={cn(
                'flex gap-4 p-5 rounded-xl border transition-colors',
                isDone
                  ? 'bg-accent-emerald/5 border-accent-emerald/20'
                  : 'bg-surface-1 border-border-subtle',
              )}
            >
              {/* Step number / checkmark */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-[0.75rem] font-bold shrink-0 mt-0.5',
                isDone
                  ? 'bg-accent-emerald text-white'
                  : 'bg-surface-3 text-text-muted',
              )}>
                {isDone ? (
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Step type + required badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{STEP_TYPE_ICON[step.stepType]}</span>
                  <span className="text-[0.68rem] font-semibold text-text-muted uppercase tracking-wider">
                    {step.stepType === 'course' ? 'Corso' : step.stepType === 'video' ? 'Video' : 'Materiale'}
                  </span>
                  {!step.isRequired && (
                    <span className="text-[0.65rem] text-text-muted border border-dashed border-border-subtle px-1.5 py-0.5 rounded">
                      Opzionale
                    </span>
                  )}
                </div>

                {/* Course step */}
                {step.stepType === 'course' && (
                  <div className="flex items-start gap-3">
                    {step.course.thumbnail_url ? (
                      <img
                        src={step.course.thumbnail_url}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-surface-3 flex items-center justify-center text-xl shrink-0">
                        {AREA_CONFIG[step.course.area as AreaCode]?.emoji ?? '📚'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.88rem] font-semibold text-text-primary">
                        {step.title ?? step.course.title}
                      </div>
                      {step.course.duration_min && (
                        <div className="text-[0.72rem] text-text-muted mt-0.5">
                          {step.course.duration_min}min
                        </div>
                      )}
                      <div className="mt-2">
                        {enrolledCourseIds.has(step.course.id) ? (
                          <Link
                            href={`/learn/${step.course.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.75rem] font-semibold rounded-md bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors"
                          >
                            {isDone ? 'Rivedi corso' : 'Vai al corso'}
                          </Link>
                        ) : (
                          <Link
                            href={`/catalogo-corsi/${step.course.slug}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.75rem] font-semibold rounded-md bg-surface-2 text-text-secondary hover:text-text-primary border border-border-subtle transition-colors"
                          >
                            Scopri il corso
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Video step */}
                {step.stepType === 'video' && (
                  <div>
                    <div className="text-[0.88rem] font-semibold text-text-primary mb-1">
                      {step.title ?? 'Video dedicato'}
                    </div>
                    {step.durationSec && (
                      <div className="text-[0.72rem] text-text-muted mb-2">
                        {Math.floor(step.durationSec / 60)}min
                      </div>
                    )}
                    {!isDone && (
                      <button
                        onClick={() => handleComplete(step.id)}
                        disabled={completingId === step.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.75rem] font-semibold rounded-md bg-accent-amber/15 text-accent-amber hover:bg-accent-amber/25 border border-accent-amber/20 transition-colors disabled:opacity-50"
                      >
                        {completingId === step.id ? 'Salvataggio...' : 'Segna come visto'}
                      </button>
                    )}
                  </div>
                )}

                {/* Material step */}
                {step.stepType === 'material' && (
                  <div>
                    <div className="text-[0.88rem] font-semibold text-text-primary mb-1">
                      {step.title ?? step.materialUrl}
                    </div>
                    <div className="text-[0.72rem] text-text-muted uppercase tracking-wide mb-2">
                      {step.materialType}
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={step.materialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.75rem] font-semibold rounded-md bg-surface-2 text-text-secondary hover:text-text-primary border border-border-subtle transition-colors"
                      >
                        Apri {step.materialType === 'pdf' ? 'PDF' : 'link'}
                      </a>
                      {!isDone && (
                        <button
                          onClick={() => handleComplete(step.id)}
                          disabled={completingId === step.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.75rem] font-semibold rounded-md bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20 border border-accent-cyan/20 transition-colors disabled:opacity-50"
                        >
                          {completingId === step.id ? 'Salvataggio...' : 'Segna come completato'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
