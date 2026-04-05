import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export interface DashboardLearningPath {
  id: string;
  slug: string;
  title: string;
  stepCount: number;
  estimatedHours: number | null;
  isCompleted: boolean;
}

interface LearningPathsProps {
  paths: DashboardLearningPath[];
}

export function LearningPaths({ paths }: LearningPathsProps) {
  return (
    <Card>
      <div className="px-5 pt-5">
        <div className="font-heading text-[0.98rem] font-bold text-text-primary tracking-tight">
          Percorsi
        </div>
        <div className="text-[0.72rem] text-text-muted mt-px">
          Guidati per ruolo
        </div>
      </div>

      <div className="px-5 pb-5 pt-4 flex flex-col gap-2">
        {paths.length === 0 ? (
          <p className="text-[0.75rem] text-text-muted py-2">
            Nessun percorso disponibile.
          </p>
        ) : (
          paths.map((path) => (
            <Link
              key={path.id}
              href={`/learning-paths/${path.slug}`}
              className="flex items-center gap-3 p-3 bg-surface-2 rounded-sm cursor-pointer border border-transparent hover:bg-surface-3 hover:border-border-subtle transition-all"
            >
              {/* Icon */}
              <div className="w-[42px] h-[42px] rounded-sm flex items-center justify-center text-lg shrink-0 bg-accent-cyan/[0.08]">
                {path.isCompleted ? '✅' : '🗺️'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[0.8rem] font-semibold text-text-primary truncate">
                  {path.title}
                </div>
                <div className="text-[0.7rem] text-text-muted mt-0.5">
                  {path.stepCount} {path.stepCount === 1 ? 'passo' : 'passi'}
                  {path.estimatedHours ? ` · ~${path.estimatedHours}h` : ''}
                </div>
              </div>
            </Link>
          ))
        )}

        <Link
          href="/learning-paths"
          className="mt-1 text-center text-[0.72rem] text-accent-cyan hover:text-accent-cyan/80 transition-colors py-1"
        >
          Vedi tutti i percorsi →
        </Link>
      </div>
    </Card>
  );
}
