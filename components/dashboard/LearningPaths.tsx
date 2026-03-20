import Link from 'next/link';
import { Card } from '@/components/ui/Card';

const PATHS = [
  {
    name: 'BIM Coordinator',
    detail: '4 corsi · ~20h',
    emoji: '🎯',
    bgClass: 'bg-accent-cyan/[0.08]',
  },
  {
    name: 'Certificazione BIM',
    detail: '5 corsi · ~30h',
    emoji: '🏆',
    bgClass: 'bg-accent-amber/[0.08]',
  },
  {
    name: 'RUP/DEC per PA',
    detail: '3 corsi · ~8h',
    emoji: '🏛️',
    bgClass: 'bg-accent-violet/[0.08]',
  },
];

export function LearningPaths() {
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
        {PATHS.map((path) => (
          <Link
            key={path.name}
            href="/learning-paths"
            className="flex items-center gap-3 p-3 bg-surface-2 rounded-sm cursor-pointer border border-transparent hover:bg-surface-3 hover:border-border-subtle transition-all"
          >
            <div className={`w-[42px] h-[42px] rounded-sm flex items-center justify-center text-lg shrink-0 ${path.bgClass}`}>
              {path.emoji}
            </div>
            <div>
              <div className="text-[0.8rem] font-semibold text-text-primary">
                {path.name}
              </div>
              <div className="text-[0.7rem] text-text-muted mt-0.5">
                {path.detail}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
