import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Accent color for the top border line */
  topBorder?: 'cyan' | 'amber' | 'rose' | 'emerald' | 'violet';
}

const topBorderColors: Record<string, string> = {
  cyan: 'before:bg-gradient-to-r before:from-accent-cyan before:to-transparent',
  amber: 'before:bg-gradient-to-r before:from-accent-amber before:to-transparent',
  rose: 'before:bg-gradient-to-r before:from-accent-rose before:to-transparent',
  emerald: 'before:bg-gradient-to-r before:from-accent-emerald before:to-transparent',
  violet: 'before:bg-gradient-to-r before:from-accent-violet before:to-transparent',
};

export function Card({ children, className, topBorder }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface-1 border border-border-subtle rounded-lg overflow-hidden transition-colors hover:border-border-hover',
        topBorder && 'relative before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px]',
        topBorder && topBorderColors[topBorder],
        className,
      )}
    >
      {children}
    </div>
  );
}
