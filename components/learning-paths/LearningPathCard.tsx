import Link from 'next/link';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LEVEL_LABELS, AREA_CONFIG } from '@/lib/area-config';
import type { LearningPath, LevelCode, AreaCode } from '@/types';

interface LearningPathCardProps {
  path: LearningPath;
  stepCount: number;
  /** From learning_path_progress — undefined if user has never opened the path */
  isCompleted: boolean;
  hasStarted: boolean;
}

export function LearningPathCard({
  path,
  stepCount,
  isCompleted,
  hasStarted,
}: LearningPathCardProps) {
  const area = path.target_role?.includes('PA') ? 'NL' : 'OB';

  return (
    <Link
      href={`/learning-paths/${path.slug}`}
      className="group block bg-surface-1 border border-border-subtle rounded-xl overflow-hidden hover:border-accent-cyan/30 transition-all duration-200 hover:shadow-lg hover:shadow-black/20"
    >
      {/* Thumbnail / gradient header */}
      <div className="relative h-32 overflow-hidden">
        {path.thumbnail_url ? (
          <img
            src={path.thumbnail_url}
            alt={path.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-end p-4"
            style={{
              background: `linear-gradient(135deg, #040B11 0%, #0f1f2e 60%, #0a1520 100%)`,
            }}
          >
            <div className="text-3xl opacity-60">
              {AREA_CONFIG[area as AreaCode]?.emoji ?? '🗺️'}
            </div>
          </div>
        )}

        {/* Status badge */}
        {isCompleted && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-accent-emerald/20 border border-accent-emerald/30 text-[0.65rem] font-bold text-accent-emerald uppercase tracking-wider">
            Completato
          </div>
        )}
        {hasStarted && !isCompleted && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-accent-amber/20 border border-accent-amber/30 text-[0.65rem] font-bold text-accent-amber uppercase tracking-wider">
            In corso
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Role + Level */}
        <div className="flex items-center gap-2 mb-2.5">
          {path.target_role && (
            <span className="text-[0.68rem] font-semibold text-accent-cyan/80 uppercase tracking-wider">
              {path.target_role}
            </span>
          )}
          {path.target_role && path.level && (
            <span className="text-text-muted/30 text-xs">·</span>
          )}
          {path.level && (
            <span className="text-[0.68rem] text-text-muted">
              {LEVEL_LABELS[path.level as LevelCode]}
            </span>
          )}
        </div>

        <h3 className="text-[0.92rem] font-bold text-text-primary leading-snug mb-1 group-hover:text-accent-cyan transition-colors">
          {path.title}
        </h3>

        {path.subtitle && (
          <p className="text-[0.75rem] text-text-secondary leading-relaxed line-clamp-2 mb-3">
            {path.subtitle}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[0.72rem] text-text-muted mb-3">
          <span>{stepCount} {stepCount === 1 ? 'passo' : 'passi'}</span>
          {path.estimated_hours && (
            <>
              <span className="text-text-muted/30">·</span>
              <span>~{path.estimated_hours}h</span>
            </>
          )}
        </div>

        {/* Progress bar — only if started */}
        {(hasStarted || isCompleted) && (
          <ProgressBar
            percentage={isCompleted ? 100 : 10}
            color={isCompleted ? 'emerald' : 'cyan'}
          />
        )}
      </div>
    </Link>
  );
}
