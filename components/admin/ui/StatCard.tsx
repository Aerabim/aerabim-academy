import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: 'cyan' | 'amber' | 'emerald' | 'violet' | 'rose';
  className?: string;
}

const accentStyles: Record<string, { bg: string; text: string; border: string }> = {
  cyan: { bg: 'bg-accent-cyan/8', text: 'text-accent-cyan', border: 'border-accent-cyan/15' },
  amber: { bg: 'bg-accent-amber/8', text: 'text-accent-amber', border: 'border-accent-amber/15' },
  emerald: { bg: 'bg-accent-emerald/8', text: 'text-accent-emerald', border: 'border-accent-emerald/15' },
  violet: { bg: 'bg-accent-violet/8', text: 'text-accent-violet', border: 'border-accent-violet/15' },
  rose: { bg: 'bg-accent-rose/8', text: 'text-accent-rose', border: 'border-accent-rose/15' },
};

export function StatCard({ label, value, icon, accent = 'cyan', className }: StatCardProps) {
  const colors = accentStyles[accent];

  return (
    <div
      className={cn(
        'bg-surface-1 border border-border-subtle rounded-lg p-5 flex items-start gap-4 transition-colors hover:border-border-hover',
        className,
      )}
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', colors.bg, colors.border, 'border')}>
        <span className={cn('w-5 h-5', colors.text)}>{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="text-[0.72rem] font-medium text-text-muted uppercase tracking-wide">
          {label}
        </div>
        <div className="text-[1.5rem] font-heading font-bold text-text-primary mt-0.5 leading-tight">
          {value}
        </div>
      </div>
    </div>
  );
}
