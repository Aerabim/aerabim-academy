'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AREA_CONFIG } from '@/lib/area-config';
import { BookmarkButton } from '@/components/ui/BookmarkButton';
import type { AreaCode } from '@/types';

const ACCENT = '#4ECDC4';

/* ── Letter-scramble hook ───────────────────────────────── */

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/@\\';

function useScramble(text: string, active: boolean): string {
  const [display, setDisplay] = useState(text);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!active) {
      setDisplay(text);
      return;
    }

    const chars = text.split('');
    let step = 0;

    function tick() {
      setDisplay(
        chars
          .map((c, i) => {
            if (c === ' ') return ' ';
            if (i < step) return c;
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          })
          .join(''),
      );
      if (step < chars.length) {
        step += 0.45;
        timerRef.current = setTimeout(tick, 28);
      }
    }

    tick();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, text]);

  return display;
}

/* ── Types ──────────────────────────────────────────────── */

export interface CourseChip {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  area: AreaCode;
}

export interface BannerPath {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  thumbnailUrl: string | null;
  thumbnailPosition?: string;
  estimatedHours: number | null;
  courseCount: number;
  isCompleted: boolean;
  hasStarted: boolean;
  coursePreview: CourseChip[];
  initialFavorited?: boolean;
}

interface LearningPathBannerProps {
  path: BannerPath;
  index: number;
}

/* ── Component ──────────────────────────────────────────── */

export function LearningPathBanner({ path, index }: LearningPathBannerProps) {
  const bannerRef = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 30, y: 50 });
  const [visible, setVisible] = useState(false);

  const accent = ACCENT;
  const progressPct = path.isCompleted ? 100 : path.hasStarted ? 20 : 0;
  const displayTitle = useScramble(path.title, hovered);

  /* Entrance animation via IntersectionObserver */
  useEffect(() => {
    const el = bannerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <Link
      ref={bannerRef}
      href={`/learning-paths/${path.slug}`}
      className={cn(
        'relative block w-full h-[200px] md:h-[224px] overflow-hidden rounded-xl',
        'border border-border-subtle transition-[opacity,transform,border-color,box-shadow] duration-500 ease-out',
        hovered && 'border-opacity-0',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
      )}
      style={{
        transitionDelay: `${index * 80}ms`,
        boxShadow: hovered
          ? `0 0 0 1px ${accent}40, 0 8px 32px -8px ${accent}30`
          : '0 0 0 1px transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* ── Background ── */}
      {path.thumbnailUrl ? (
        <>
          <img
            src={path.thumbnailUrl}
            alt=""
            className={cn(
              'absolute inset-0 w-full h-full object-cover transition-transform duration-700',
              hovered && 'scale-[1.04]',
            )}
            style={{ objectPosition: path.thumbnailPosition ?? '50% 50%' }}
          />
          {/* Overlay: heavy on left for text, lighter on right for thumbnail visibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#040B11]/95 via-[#040B11]/75 to-[#040B11]/35" />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #040B11 0%, #0c1a26 55%, #091420 100%)' }}
        />
      )}

      {/* Geometric pattern overlay — BIM/grid feel */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(${accent} 1px, transparent 1px),
            linear-gradient(90deg, ${accent} 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Mouse-tracking radial glow */}
      <div
        className={cn(
          'absolute inset-0 pointer-events-none transition-opacity duration-300',
          hovered ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          background: `radial-gradient(480px circle at ${mousePos.x}% ${mousePos.y}%, ${accent}1c, transparent 65%)`,
        }}
      />

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 h-full transition-all duration-300"
        style={{
          width: hovered ? '5px' : '4px',
          background: `linear-gradient(to bottom, ${accent}, ${accent}80)`,
          boxShadow: hovered ? `2px 0 12px 0 ${accent}50` : 'none',
        }}
      />

      {/* Bookmark button */}
      <div className="absolute top-3 right-3 z-30">
        <BookmarkButton
          itemType="path"
          itemId={path.id}
          initialFavorited={path.initialFavorited ?? false}
        />
      </div>

      {/* ── Content ── */}
      <div className="absolute inset-0 flex items-center pl-8 pr-4 md:pr-6">

        {/* Left: text block */}
        <div
          className={cn(
            'flex flex-col gap-1.5 min-w-0 transition-transform duration-300',
            path.coursePreview.length > 0 ? 'flex-1 max-w-[58%]' : 'flex-1',
            hovered && 'translate-x-0.5',
          )}
        >
          {/* Title — scrambles on hover, resolves with cyan gradient */}
          <h2
            className="font-heading text-xl md:text-[1.45rem] font-extrabold leading-tight tracking-wide transition-none"
            style={hovered ? {
              backgroundImage: `linear-gradient(90deg, ${ACCENT} 0%, #a5f3f0 60%, #e0fffe 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            } : {
              color: 'var(--color-text-primary)',
            }}
          >
            {displayTitle}
          </h2>

          {/* Subtitle */}
          {path.subtitle && (
            <p className="text-[0.76rem] text-text-secondary leading-relaxed line-clamp-2 max-w-lg">
              {path.subtitle}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-[0.7rem] text-text-muted">
            <span>{path.courseCount} {path.courseCount === 1 ? 'corso' : 'corsi'}</span>
            {path.estimatedHours && (
              <>
                <span className="opacity-25">·</span>
                <span>~{path.estimatedHours}h</span>
              </>
            )}
            {path.isCompleted && (
              <>
                <span className="opacity-25">·</span>
                <span className="text-accent-emerald font-semibold">✓ Completato</span>
              </>
            )}
            {path.hasStarted && !path.isCompleted && (
              <>
                <span className="opacity-25">·</span>
                <span className="font-medium" style={{ color: accent }}>In corso</span>
              </>
            )}
          </div>
        </div>

        {/* Right: course preview chips */}
        {path.coursePreview.length > 0 && (
          <div className="hidden sm:flex flex-col gap-2 shrink-0 w-[200px] md:w-[220px] ml-auto">
            {path.coursePreview.map((course, i) => (
              <div
                key={course.id}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg pointer-events-none',
                  'bg-white/[0.04] border border-white/[0.07]',
                  'transition-all duration-300 ease-out',
                  hovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-3',
                )}
                style={{ transitionDelay: hovered ? `${i * 55}ms` : '0ms' }}
              >
                <div className="w-8 h-8 rounded shrink-0 overflow-hidden bg-surface-3">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm">
                      {AREA_CONFIG[course.area]?.emoji ?? '📚'}
                    </div>
                  )}
                </div>
                <span className="text-[0.7rem] text-text-secondary leading-snug line-clamp-2 flex-1 min-w-0">
                  {course.title}
                </span>
              </div>
            ))}

            {path.courseCount > path.coursePreview.length && (
              <div
                className={cn(
                  'text-[0.67rem] text-text-muted pl-3 transition-all duration-300',
                  hovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-3',
                )}
                style={{ transitionDelay: hovered ? `${path.coursePreview.length * 55}ms` : '0ms' }}
              >
                + altri {path.courseCount - path.coursePreview.length} corsi
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Progress bar (bottom) ── */}
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-surface-3/40">
        {progressPct > 0 && (
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${progressPct}%`,
              background: progressPct === 100 ? '#34d399' : accent,
              boxShadow: `0 0 6px 1px ${progressPct === 100 ? '#34d399' : accent}70`,
            }}
          />
        )}
      </div>
    </Link>
  );
}
