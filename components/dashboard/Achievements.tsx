import { Card } from '@/components/ui/Card';

const BADGES = [
  {
    name: 'Early Adopter',
    desc: 'Tra i primi 100 iscritti',
    emoji: '🥇',
    bgClass: 'bg-accent-amber/10',
    locked: false,
  },
  {
    name: 'Streak 7 giorni',
    desc: '7 giorni consecutivi',
    emoji: '🔥',
    bgClass: 'bg-accent-amber/10',
    locked: false,
  },
  {
    name: 'IFC Master',
    desc: 'Completa corsi OpenBIM',
    emoji: '🔒',
    bgClass: 'bg-[rgba(74,100,120,0.08)]',
    locked: true,
  },
];

export function Achievements() {
  return (
    <Card>
      <div className="px-5 pt-5">
        <div className="font-heading text-[0.98rem] font-bold text-text-primary tracking-tight">
          Traguardi
        </div>
        <div className="text-[0.72rem] text-text-muted mt-px">
          Badge e riconoscimenti
        </div>
      </div>
      <div className="px-5 pb-5 pt-4 flex flex-col gap-2">
        {BADGES.map((badge) => (
          <div
            key={badge.name}
            className="flex items-center gap-3 p-3 bg-surface-2 rounded-sm border border-transparent hover:bg-surface-3 hover:border-border-subtle transition-all"
          >
            <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center text-lg shrink-0 ${badge.bgClass}`}>
              {badge.emoji}
            </div>
            <div>
              <div className={`text-[0.8rem] font-semibold ${badge.locked ? 'text-text-muted' : 'text-text-primary'}`}>
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
