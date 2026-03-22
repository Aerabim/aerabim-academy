'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { LiveSessionType } from '@/types';

type FilterValue = 'all' | LiveSessionType;

interface SessionTypeFilterProps {
  onChange: (value: FilterValue) => void;
}

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'mentoring', label: 'Mentoring' },
];

export function SessionTypeFilter({ onChange }: SessionTypeFilterProps) {
  const [active, setActive] = useState<FilterValue>('all');

  const handleClick = useCallback(
    (value: FilterValue) => {
      setActive(value);
      onChange(value);
    },
    [onChange],
  );

  return (
    <div className="flex items-center gap-1 p-1 bg-surface-2 rounded-lg w-fit">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => handleClick(f.value)}
          className={cn(
            'px-3.5 py-1.5 rounded-md text-[0.78rem] font-semibold transition-all',
            active === f.value
              ? 'bg-surface-4 text-text-primary shadow-sm'
              : 'text-text-muted hover:text-text-secondary',
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
