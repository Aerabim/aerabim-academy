'use client';

import { cn } from '@/lib/utils';

interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: FormSelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function FormSelect({
  label,
  id,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  error,
  className,
}: FormSelectProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={id}
        className="block text-[0.78rem] font-medium text-text-secondary"
      >
        {label}
        {required && <span className="text-accent-rose ml-0.5">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 bg-surface-2 border rounded-md text-[0.82rem] text-text-primary',
          'transition-colors focus:outline-none focus:ring-1',
          error
            ? 'border-accent-rose focus:border-accent-rose focus:ring-accent-rose/20'
            : 'border-border-subtle focus:border-accent-cyan/50 focus:ring-accent-cyan/20',
          disabled && 'opacity-50 cursor-not-allowed',
          !value && 'text-text-muted',
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-[0.7rem] text-accent-rose">{error}</p>
      )}
    </div>
  );
}
