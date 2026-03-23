'use client';

import { usePathname } from 'next/navigation';

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

const ROUTE_TITLES: Record<string, string> = {
  '/admin': 'Panoramica',
  '/admin/corsi': 'Gestione Corsi',
  '/admin/sessioni-live': 'Sessioni Live',
  '/admin/risorse': 'Risorse',
  '/admin/utenti': 'Utenti',
  '/admin/iscrizioni': 'Iscrizioni',
  '/admin/community': 'Community',
  '/admin/richieste-sessioni': 'Richieste Sessioni',
  '/admin/analytics': 'Analytics',
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];

  // Check prefix matches (for sub-routes like /admin/corsi/[id])
  for (const [route, title] of Object.entries(ROUTE_TITLES)) {
    if (route !== '/admin' && pathname.startsWith(route)) return title;
  }

  return 'Admin';
}

export function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

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

      {/* Page title */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[0.7rem] text-text-muted font-medium">Admin</span>
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-text-muted">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <h2 className="text-[0.88rem] font-semibold text-text-primary truncate">
          {title}
        </h2>
      </div>

      <div className="flex-1" />
    </header>
  );
}
