'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { DashboardUser } from '@/types';

/* ── Navigation config ── */

interface SidebarNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SidebarNavSection {
  title: string;
  items: SidebarNavItem[];
}

const SECTIONS: SidebarNavSection[] = [
  {
    title: 'Principale',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        ),
      },
      {
        href: '/catalogo-corsi',
        label: 'Catalogo Corsi',
        badge: '12',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
        ),
      },
      {
        href: '/i-miei-corsi',
        label: 'I Miei Corsi',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        ),
      },
      {
        href: '/certificati',
        label: 'Certificati',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" />
            <path d="M14 2v6h6" />
            <path d="M9 15l2 2 4-4" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Percorsi',
    items: [
      {
        href: '/learning-paths',
        label: 'Learning Paths',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        ),
      },
      {
        href: '/community',
        label: 'Community',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        ),
      },
      {
        href: '/sessioni-live',
        label: 'Sessioni Live',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        href: '/profilo',
        label: 'Profilo',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
      },
      {
        href: '/impostazioni',
        label: 'Impostazioni',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        ),
      },
    ],
  },
];

const PLAN_LABELS: Record<string, string> = {
  free: 'Piano Free',
  pro: 'Piano Pro',
  team: 'Piano Team',
  pa: 'Piano PA',
};

/* ── Component ── */

interface SidebarProps {
  user: DashboardUser;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ user, open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-[260px] bg-surface-1 border-r border-border-subtle',
          'flex flex-col transition-transform duration-200 shrink-0',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="px-6 pt-[26px] pb-[22px] border-b border-border-subtle">
          <Link href="/dashboard" onClick={onClose} className="block">
            <h1 className="font-heading text-[1.45rem] font-bold tracking-tight text-text-primary">
              Aer<span className="text-accent-cyan font-extrabold">ACADEMY</span>
            </h1>
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-text-muted font-semibold mt-[5px]">
              by Aerabim
            </p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3.5 px-3 flex flex-col gap-px overflow-y-auto scrollbar-thin">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="font-heading text-[0.62rem] uppercase tracking-[0.16em] text-text-muted px-3 pt-[18px] pb-2 font-bold">
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'relative flex items-center gap-[11px] px-3.5 py-2.5 rounded-sm text-[0.82rem] font-medium transition-all select-none',
                      isActive
                        ? 'bg-accent-cyan-dim text-accent-cyan'
                        : 'text-text-secondary hover:bg-[rgba(157,177,191,0.05)] hover:text-text-primary',
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-accent-cyan rounded-r" />
                    )}
                    <span className="w-5 h-5 flex items-center justify-center shrink-0">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-accent-cyan text-brand-dark text-[0.6rem] font-extrabold font-heading px-[7px] py-[2px] rounded-[10px]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="px-3.5 py-3.5 border-t border-border-subtle">
          <Link
            href="/profilo"
            onClick={onClose}
            className="flex items-center gap-[11px] p-2.5 rounded-sm transition-colors hover:bg-[rgba(157,177,191,0.05)]"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-cyan to-brand-blue flex items-center justify-center font-heading text-[0.78rem] font-extrabold text-brand-dark shrink-0">
              {user.initials}
            </div>
            <div className="overflow-hidden">
              <div className="text-[0.8rem] font-semibold text-text-primary truncate">
                {user.fullName}
              </div>
              <div className="text-[0.67rem] text-accent-cyan font-semibold font-heading flex items-center gap-1">
                <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                {PLAN_LABELS[user.plan] || 'Piano Free'}
              </div>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
