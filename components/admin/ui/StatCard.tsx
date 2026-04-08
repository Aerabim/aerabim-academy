import { cn } from '@/lib/utils';

export interface StatCardDelta {
  value: number;
  label: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: 'cyan' | 'amber' | 'emerald' | 'violet' | 'rose';
  delta?: StatCardDelta;
  className?: string;
}

const accentStyles: Record<string, { bg: string; text: string; border: string }> = {
  cyan:    { bg: 'bg-accent-cyan/8',    text: 'text-accent-cyan',    border: 'border-accent-cyan/15'    },
  amber:   { bg: 'bg-accent-amber/8',   text: 'text-accent-amber',   border: 'border-accent-amber/15'   },
  emerald: { bg: 'bg-accent-emerald/8', text: 'text-accent-emerald', border: 'border-accent-emerald/15' },
  violet:  { bg: 'bg-accent-violet/8',  text: 'text-accent-violet',  border: 'border-accent-violet/15'  },
  rose:    { bg: 'bg-accent-rose/8',    text: 'text-accent-rose',    border: 'border-accent-rose/15'    },
};

export function StatCard({ label, value, icon, accent = 'cyan', delta, className }: StatCardProps) {
  const colors = accentStyles[accent];

  const deltaPositive = delta && delta.value > 0;
  const deltaNeutral  = delta && delta.value === 0;

  return (
    <div
      className={cn(
        'bg-surface-1 border border-border-subtle rounded-lg p-5 flex items-start gap-4 transition-colors hover:border-border-hover',
        className,
      )}
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border', colors.bg, colors.border)}>
        <span className={cn('w-5 h-5', colors.text)}>{icon}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[0.72rem] font-medium text-text-muted uppercase tracking-wide">
          {label}
        </div>
        <div className="flex items-end gap-2.5 mt-0.5">
          <div className="text-[1.5rem] font-heading font-bold text-text-primary leading-tight">
            {value}
          </div>
          {delta !== undefined && (
            <span
              className={cn(
                'mb-[3px] text-[0.68rem] font-semibold font-sans px-1.5 py-[2px] rounded-full leading-none',
                deltaNeutral
                  ? 'bg-surface-3 text-text-muted'
                  : deltaPositive
                    ? 'bg-accent-emerald/12 text-accent-emerald'
                    : 'bg-accent-rose/12 text-accent-rose',
              )}
            >
              {deltaPositive ? '+' : ''}{delta.value} {delta.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
