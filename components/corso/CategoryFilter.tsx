'use client';

import { cn } from '@/lib/utils';
import { CATEGORY_OPTIONS, type CategoryFilterValue } from '@/lib/area-config';

interface CategoryFilterProps {
  active: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
}

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'font-heading text-[0.78rem] font-semibold px-4 py-2 rounded-full border transition-colors',
            active === opt.value
              ? 'bg-accent-cyan text-brand-dark border-accent-cyan'
              : 'bg-transparent text-text-secondary border-border-hover hover:text-text-primary hover:border-text-muted',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
