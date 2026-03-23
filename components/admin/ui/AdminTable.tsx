'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface AdminTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  emptyMessage?: string;
  className?: string;
}

export function AdminTable<T>({
  columns,
  data,
  keyExtractor,
  searchable,
  searchPlaceholder = 'Cerca...',
  onSearch,
  emptyMessage = 'Nessun risultato.',
  className,
}: AdminTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');

  function handleSearch(q: string) {
    setSearchQuery(q);
    onSearch?.(q);
  }

  return (
    <div className={cn('space-y-3', className)}>
      {searchable && (
        <div className="relative max-w-xs">
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-border-subtle rounded-md text-[0.78rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20 transition-all"
          />
        </div>
      )}

      <div className="overflow-x-auto border border-border-subtle rounded-lg">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-2/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-[0.82rem] text-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="border-b border-border-subtle last:border-b-0 hover:bg-surface-2/30 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-[0.82rem] text-text-secondary',
                        col.className,
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
