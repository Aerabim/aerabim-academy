import { LearningPathCard } from './LearningPathCard';
import type { LearningPath } from '@/types';

interface LearningPathGridProps {
  paths: LearningPath[];
  stepCounts: Record<string, number>;
  completedPathIds: Set<string>;
  startedPathIds: Set<string>;
}

export function LearningPathGrid({
  paths,
  stepCounts,
  completedPathIds,
  startedPathIds,
}: LearningPathGridProps) {
  if (paths.length === 0) {
    return (
      <div className="text-center py-20 text-text-muted text-[0.85rem]">
        Nessun percorso disponibile al momento.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {paths.map((path) => (
        <LearningPathCard
          key={path.id}
          path={path}
          stepCount={stepCounts[path.id] ?? 0}
          isCompleted={completedPathIds.has(path.id)}
          hasStarted={startedPathIds.has(path.id)}
        />
      ))}
    </div>
  );
}
