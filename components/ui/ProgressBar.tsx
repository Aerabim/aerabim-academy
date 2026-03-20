import { cn } from '@/lib/utils';

interface ProgressBarProps {
  /** 0-100 */
  percentage: number;
  color?: 'cyan' | 'amber' | 'emerald';
  className?: string;
}

const fillColors: Record<string, string> = {
  cyan: 'bg-accent-cyan',
  amber: 'bg-accent-amber',
  emerald: 'bg-accent-emerald',
};

export function ProgressBar({ percentage, color = 'cyan', className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div className={cn('w-full h-1 bg-surface-3 rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-700 ease-out', fillColors[color])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
