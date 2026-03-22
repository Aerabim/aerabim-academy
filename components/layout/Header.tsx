'use client';

import { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Breadcrumb } from './Breadcrumb';

/** Pages where the search bar is shown */
const SEARCH_ROUTES = ['/catalogo-corsi', '/i-miei-corsi', '/dashboard'];

interface HeaderProps {
  onMenuToggle: () => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export function Header({ onMenuToggle, onSearch, searchQuery = '' }: HeaderProps) {
  const pathname = usePathname();
  const showSearch = SEARCH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));

  return (
    <header className="sticky top-0 z-20 glassmorphism border-b border-border-subtle h-[62px] px-4 lg:px-9 flex items-center gap-3">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Apri menu"
      >
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search bar — only on relevant pages */}
      {showSearch && onSearch && (
        <HeaderSearch value={searchQuery} onChange={onSearch} />
      )}
    </header>
  );
}

function HeaderSearch({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative w-full max-w-[280px]">
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Cerca..."
        className="w-full pl-9 pr-8 py-1.5 bg-surface-1 border border-border-subtle rounded-md text-[0.78rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20 transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
