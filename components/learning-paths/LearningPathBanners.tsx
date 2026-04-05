import { LearningPathBanner } from './LearningPathBanner';
import type { BannerPath } from './LearningPathBanner';

interface LearningPathBannersProps {
  paths: BannerPath[];
}

export function LearningPathBanners({ paths }: LearningPathBannersProps) {
  if (paths.length === 0) {
    return (
      <p className="text-[0.82rem] text-text-muted py-6 text-center">
        Nessun percorso disponibile al momento.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {paths.map((path, index) => (
        <LearningPathBanner key={path.id} path={path} index={index} />
      ))}
    </div>
  );
}
