'use client';

import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

interface HeaderProps {
  fullName: string;
  onMenuToggle: () => void;
}

export function Header({ fullName, onMenuToggle }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  }

  return (
    <header className="sticky top-0 z-20 glassmorphism border-b border-border-subtle h-[62px] px-4 lg:px-9 flex items-center justify-between">
      {/* Left: hamburger (mobile) + search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Apri menu"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Search box */}
        <div className="hidden sm:flex items-center gap-2.5 bg-surface-2 border border-[rgba(157,177,191,0.08)] rounded-md px-4 py-2 w-[300px] transition-all focus-within:border-accent-cyan/25 focus-within:shadow-[0_0_0_3px_rgba(78,205,196,0.06)]">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="shrink-0 text-text-muted">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Cerca corsi, lezioni, argomenti..."
            className="bg-transparent border-none outline-none text-text-primary font-sans text-[0.82rem] w-full placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">
        {/* Notification bell */}
        <button
          className="relative w-[38px] h-[38px] rounded-sm flex items-center justify-center text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-all"
          title="Notifiche"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className="absolute top-[7px] right-[7px] w-[7px] h-[7px] bg-accent-rose rounded-full border-2 border-surface-0" />
        </button>

        {/* Live indicator */}
        <button
          className="w-[38px] h-[38px] rounded-sm flex items-center justify-center text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-all"
          title="Live"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.636 15.536a5 5 0 010-7.072M2.808 18.364a9 9 0 010-12.728" />
          </svg>
        </button>

        {/* User name + logout */}
        <div className="hidden md:flex items-center gap-3 ml-2 pl-3 border-l border-border-subtle">
          <span className="text-[0.8rem] text-text-secondary font-medium">
            {fullName}
          </span>
          <button
            onClick={handleLogout}
            className="text-[0.78rem] text-text-muted hover:text-text-primary transition-colors px-2.5 py-1.5 rounded-sm hover:bg-surface-2 font-medium"
          >
            Esci
          </button>
        </div>
      </div>
    </header>
  );
}
