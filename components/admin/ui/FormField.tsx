'use client';

import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
  className?: string;
}

export function FormField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  disabled,
  hint,
  error,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={id}
        className="block text-[0.78rem] font-medium text-text-secondary"
      >
        {label}
        {required && <span className="text-accent-rose ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 bg-surface-2 border rounded-md text-[0.82rem] text-text-primary',
          'placeholder:text-text-muted transition-colors',
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
