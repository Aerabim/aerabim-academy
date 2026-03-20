import { cn } from '@/lib/utils';
import type { AccentColor } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: AccentColor;
  className?: string;
}

const variantStyles: Record<AccentColor, string> = {
  cyan: 'bg-accent-cyan/10 text-accent-cyan',
  amber: 'bg-accent-amber/10 text-accent-amber',
  rose: 'bg-accent-rose/10 text-accent-rose',
  emerald: 'bg-accent-emerald/10 text-accent-emerald',
  violet: 'bg-accent-violet/10 text-accent-violet',
};

export function Badge({ children, variant = 'cyan', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-heading text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
