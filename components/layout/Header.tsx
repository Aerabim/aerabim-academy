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
      {/* Left: hamburger (mobile) */}
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
      </div>

      {/* Right: user name + logout */}
      <div className="flex items-center gap-3">
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
    </header>
  );
}
