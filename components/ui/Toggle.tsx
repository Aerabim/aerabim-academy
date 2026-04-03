'use client';

import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export function Toggle({ checked, onChange, disabled = false, label, description }: ToggleProps) {
  return (
    <label className={cn(
      'flex items-start justify-between gap-4 cursor-pointer group',
      disabled && 'opacity-50 cursor-not-allowed',
    )}>
      <div className="flex-1 min-w-0">
        {label && (
          <span className="block text-[0.82rem] font-medium text-text-primary group-hover:text-text-primary transition-colors">
            {label}
          </span>
        )}
        {description && (
          <span className="block text-[0.74rem] text-text-muted mt-0.5 leading-relaxed">
            {description}
          </span>
        )}
      </div>

      <div className="relative shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={cn(
          'w-10 h-[22px] rounded-full transition-colors duration-200',
          checked ? 'bg-accent-cyan' : 'bg-surface-3',
        )}>
          <div className={cn(
            'absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-[22px]' : 'translate-x-[3px]',
          )} />
        </div>
      </div>
    </label>
  );
}
