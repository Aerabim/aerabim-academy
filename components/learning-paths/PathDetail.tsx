'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PathDetailPreviewVideo } from './PathDetailPreviewVideo';
import { PathStickyBuyBar } from './PathStickyBuyBar';
import { AREA_CONFIG } from '@/lib/area-config';
import { cn } from '@/lib/utils';
import type { LearningPath, LearningPathCourse, LearningPathProgressData, AreaCode, DiscountInfo } from '@/types';

interface PathDetailProps {
  path: LearningPath;
  courses: LearningPathCourse[];
  /** courseId → true if user is enrolled */
  enrolledCourseIds: Set<string>;
  /** True if user has purchased this learning path */
  isPathEnrolled: boolean;
  discountInfo?: DiscountInfo;
}

export function PathDetail({ path, courses, enrolledCourseIds, isPathEnrolled, discountInfo }: PathDetailProps) {
  const [progress, setProgress] = useState<LearningPathProgressData | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  async function handleBuyPath() {
    setCheckingOut(true);
    setCheckoutError('');
    try {
      const res = await fetch('/api/checkout/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathId: path.id, pathSlug: path.slug }),
      });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setCheckoutError(json.error ?? 'Errore durante il checkout.');
        return;
      }
      window.location.href = json.url;
    } catch {
      setCheckoutError('Errore di rete. Riprova.');
    } finally {
      setCheckingOut(false);
    }
  }

  const sorted = [...courses].sort((a, b) => a.orderNum - b.orderNum);
  const priceInCents = (path as unknown as { price_single: number }).price_single ?? 0;

  useEffect(() => {
    fetch(`/api/learning-paths/${path.id}/progress`)
      .then((r) => r.json())
      .then((json: { progress?: LearningPathProgressData }) => {
        if (json.progress) setProgress(json.progress);
      })
      .catch(() => undefined);
  }, [path.id]);

  const pct = progress?.percentage ?? 0;

  /* ── Animated counter: 0 → pct on data arrival ── */
  const [displayPct, setDisplayPct] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (pct === 0) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const duration = 900;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayPct(Math.round(pct * eased));
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
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out"
              style={{
                objectPosition: (path as unknown as { thumbnail_position?: string }).thumbnail_position ?? '50% 50%',
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

        {/* Static cyan glow */}
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
          'relative p-8 lg:p-10 transition-transform duration-300 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6',
          headerHovered && 'translate-x-0.5',
        )}>
          {/* Left: title + subtitle + progress */}
          <div className="flex-1 min-w-0">
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
                    ? `${progress.completedCourses} / ${progress.totalCourses} ${progress.totalCourses === 1 ? 'corso completato' : 'corsi completati'}`
                    : `${sorted.length} ${sorted.length === 1 ? 'corso' : 'corsi'}`}
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
          </div>

          {/* Right: CTA acquisto — desktop only, shown inline in banner */}
          {!isPathEnrolled && priceInCents > 0 && (
            <div {...delay(200)} className={cn(reveal, 'shrink-0 flex flex-col items-start lg:items-end gap-3')}>
              {checkoutError && (
                <p className="text-[0.75rem] text-accent-rose">{checkoutError}</p>
              )}

              {/* Price */}
              <div className="text-right">
                {discountInfo ? (
                  <>
                    <div className="flex items-center justify-end gap-2 mb-0.5">
                      <span className={cn(
                        'text-[0.65rem] font-bold px-1.5 py-0.5 rounded font-mono',
                        discountInfo.badgeColor === 'rose'
                          ? 'bg-accent-rose/15 text-accent-rose border border-accent-rose/25'
                          : 'bg-accent-amber/15 text-accent-amber border border-accent-amber/25',
                      )}>
                        -{discountInfo.discountPct}% {discountInfo.label}
                      </span>
                    </div>
                    <div className="text-[0.82rem] text-text-muted line-through tabular-nums leading-none">
                      €{(priceInCents / 100).toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-[1.5rem] font-extrabold text-white tabular-nums leading-tight">
                      €{(discountInfo.discountedPrice / 100).toFixed(2).replace('.', ',')}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[1.5rem] font-extrabold text-accent-amber tabular-nums leading-none">
                      €{(priceInCents / 100).toFixed(2).replace('.', ',')}
                    </div>
                  </>
                )}
                <div className="text-[0.65rem] text-white/40 mt-0.5">IVA inclusa</div>
              </div>

              {/* Button */}
              <button
                type="button"
                onClick={handleBuyPath}
                disabled={checkingOut}
                className={cn(
                  'relative overflow-hidden inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[0.85rem] font-bold transition-all duration-200 whitespace-nowrap',
                  'bg-accent-amber text-brand-dark hover:brightness-110 active:scale-95',
                  checkingOut && 'opacity-70 cursor-not-allowed',
                )}
                style={{ boxShadow: '0 0 24px -4px #F0A50070' }}
              >
                {/* Shimmer sweep */}
                {!checkingOut && (
                  <span
                    className="pointer-events-none absolute inset-0 -translate-x-full"
                    style={{
                      background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%)',
                      animation: 'shimmer-sweep 3s ease-in-out infinite',
                    }}
                  />
                )}
                {checkingOut ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Reindirizzamento…
                  </>
                ) : (
                  <>
                    Acquista percorso
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </>
                )}
              </button>

              {/* Feature tags */}
              <div className="flex flex-col gap-1">
                {[
                  { icon: 'M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', label: 'Accesso permanente' },
                  { icon: 'M4 6h16M4 10h16M4 14h8', label: `${sorted.length} ${sorted.length === 1 ? 'corso incluso' : 'corsi inclusi'}` },
                  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', label: 'Certificato di percorso' },
                ].map(({ icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 text-[0.68rem] text-white/60">
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview video */}
      {(path as unknown as { preview_playback_id: string | null }).preview_playback_id && (
        <PathDetailPreviewVideo
          playbackId={(path as unknown as { preview_playback_id: string }).preview_playback_id}
          thumbnailUrl={path.thumbnail_url}
        />
      )}

      {/* Description */}
      {path.description && (
        <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm px-6 py-5">
          {/* Scan-line texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.018]"
            style={{
              backgroundImage: 'repeating-linear-gradient(to bottom, #fff 0px, #fff 1px, transparent 1px, transparent 3px)',
            }}
          />
          {/* Glow — top right */}
          <div
            className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full blur-3xl opacity-10"
            style={{ background: '#4ECDC4' }}
          />
          {/* Content */}
          <div
            className="relative prose-editor text-text-primary text-[0.9rem] leading-[1.85]"
            dangerouslySetInnerHTML={{ __html: path.description }}
          />
        </div>
      )}

      {/* Course list */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-[0.68rem] font-semibold tracking-widest uppercase text-accent-cyan">
            Corsi del percorso
          </span>
          <span className="font-mono text-[0.68rem] text-accent-cyan/50 border border-accent-cyan/20 rounded px-1.5 py-0.5 bg-accent-cyan/5">
            [{sorted.length.toString().padStart(2, '0')}]
          </span>
        </div>

        <div className="relative">
          {/* Vertical connector line */}
          {sorted.length > 1 && (
            <div
              className="absolute left-[15px] top-8 bottom-8 w-px pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(to bottom, #4ECDC440 0px, #4ECDC440 4px, transparent 4px, transparent 10px)',
              }}
            />
          )}

          <div className="space-y-3">
            {sorted.map((entry, index) => {
              const { course } = entry;
              const isEnrolled = enrolledCourseIds.has(course.id);
              const isCompleted = progress
                ? (progress.completedCourses > index)
                : false;
              const areaConf = AREA_CONFIG[course.area as AreaCode];
              const locked = !isPathEnrolled && !isEnrolled;

              return (
                <div key={entry.courseId} className="flex gap-4">
                  {/* Node column */}
                  <div className="flex flex-col items-center justify-center shrink-0" style={{ width: 32 }}>
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-[0.75rem] font-bold z-10 ring-2',
                      isCompleted
                        ? 'bg-accent-emerald text-white ring-accent-emerald/30'
                        : locked
                          ? 'bg-surface-2 text-text-muted/50 ring-surface-1'
                          : 'bg-surface-3 text-text-muted ring-surface-1',
                    )}>
                      {isCompleted ? (
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : locked ? (
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <rect x="3" y="11" width="18" height="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                  </div>

                  {/* Card */}
                  <div className={cn(
                    'flex-1 flex gap-3 p-4 rounded-xl border transition-all duration-200 mb-0',
                    isCompleted
                      ? 'bg-accent-emerald/5 border-accent-emerald/20 hover:-translate-y-0.5 hover:shadow-lg hover:border-accent-emerald/40'
                      : locked
                        ? 'bg-surface-1/50 border-border-subtle/50 opacity-60 grayscale-[0.25]'
                        : 'bg-surface-1 border-border-subtle hover:-translate-y-0.5 hover:shadow-lg hover:border-white/15',
                  )}>
                    {/* Thumbnail */}
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-surface-3 flex items-center justify-center text-xl shrink-0">
                        {areaConf?.emoji ?? '📚'}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-[0.88rem] font-semibold text-text-primary truncate">
                          {course.title}
                        </div>
                        {course.durationMin && (
                          <div className="text-[0.72rem] text-text-muted mt-0.5">
                            {course.durationMin}min
                          </div>
                        )}
                      </div>

                      {/* CTA — right aligned */}
                      <div className="shrink-0">
                        {isEnrolled ? (
                          <Link
                            href={`/learn/${course.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.75rem] font-semibold rounded-md bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors"
                          >
                            {isCompleted ? 'Rivedi' : 'Vai al corso'}
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                              <path d="M5 12h14M13 6l6 6-6 6" />
                            </svg>
                          </Link>
                        ) : locked ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.72rem] text-text-muted/60 font-medium">
                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                              <rect x="3" y="11" width="18" height="11" rx="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
                            </svg>
                            Incluso nel percorso
                          </span>
                        ) : (
                          <Link
                            href={`/learn/${course.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.75rem] font-semibold rounded-md bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors"
                          >
                            Vai al corso
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                              <path d="M5 12h14M13 6l6 6-6 6" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky buy bar — visible only when header scrolls out of view */}
      {!isPathEnrolled && priceInCents > 0 && (
        <PathStickyBuyBar
          title={path.title}
          priceInCents={priceInCents}
          courseCount={sorted.length}
          onBuy={handleBuyPath}
          buying={checkingOut}
          headerRef={headerRef}
          discountInfo={discountInfo}
        />
      )}
    </div>
  );
}
