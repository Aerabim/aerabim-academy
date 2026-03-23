'use client';

import { cn } from '@/lib/utils';

interface FormTextareaProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  hint?: string;
  error?: string;
  className?: string;
}

export function FormTextarea({
  label,
  id,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  rows = 4,
  hint,
  error,
  className,
}: FormTextareaProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={id}
        className="block text-[0.78rem] font-medium text-text-secondary"
      >
        {label}
        {required && <span className="text-accent-rose ml-0.5">*</span>}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        className={cn(
          'w-full px-3 py-2 bg-surface-2 border rounded-md text-[0.82rem] text-text-primary',
          'placeholder:text-text-muted transition-colors resize-y',
          'focus:outline-none focus:ring-1',
          error
            ? 'border-accent-rose focus:border-accent-rose focus:ring-accent-rose/20'
            : 'border-border-subtle focus:border-accent-cyan/50 focus:ring-accent-cyan/20',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      />
      {hint && !error && (
        <p className="text-[0.7rem] text-text-muted">{hint}</p>
      )}
      {error && (
        <p className="text-[0.7rem] text-accent-rose">{error}</p>
      )}
    </div>
  );
}
