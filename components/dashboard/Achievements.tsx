import { Card } from '@/components/ui/Card';
import type { BadgeInfo } from '@/types';

interface AchievementsProps {
  badges: BadgeInfo[];
}

export function Achievements({ badges }: AchievementsProps) {
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <Card>
      <div className="px-5 pt-5 flex items-center justify-between">
        <div>
          <div className="font-heading text-[0.98rem] font-bold text-text-primary tracking-tight">
            Traguardi
          </div>
          <div className="text-[0.72rem] text-text-muted mt-px">
            Badge e riconoscimenti
          </div>
        </div>
        <span className="font-heading text-[0.76rem] font-bold text-accent-cyan">
          {unlockedCount}/{badges.length}
        </span>
      </div>
      <div className="px-5 pb-5 pt-4 flex flex-col gap-2">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center gap-3 p-3 bg-surface-2 rounded-sm border border-transparent hover:bg-surface-3 hover:border-border-subtle transition-all"
          >
            <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center text-lg shrink-0 ${badge.unlocked ? 'bg-accent-amber/10' : 'bg-[rgba(74,100,120,0.08)]'}`}>
              {badge.unlocked ? badge.emoji : '🔒'}
            </div>
            <div>
              <div className={`text-[0.8rem] font-semibold ${badge.unlocked ? 'text-text-primary' : 'text-text-muted'}`}>
                {badge.name}
              </div>
              <div className="text-[0.7rem] text-text-muted mt-0.5">
                {badge.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
