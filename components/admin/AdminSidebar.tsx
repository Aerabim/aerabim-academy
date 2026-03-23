'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/* ── Navigation config ── */

interface AdminNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

const ADMIN_SECTIONS: AdminNavSection[] = [
  {
    title: 'Generale',
    items: [
      {
        href: '/admin',
        label: 'Panoramica',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Contenuti',
    items: [
      {
        href: '/admin/corsi',
        label: 'Corsi',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
        ),
      },
      {
        href: '/admin/sessioni-live',
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
      {
        href: '/admin/risorse',
        label: 'Risorse',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8M16 17H8M10 9H8" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Utenti',
    items: [
      {
        href: '/admin/utenti',
        label: 'Utenti',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        ),
      },
      {
        href: '/admin/iscrizioni',
        label: 'Iscrizioni',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Community',
    items: [
      {
        href: '/admin/community',
        label: 'Discussioni',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        ),
      },
      {
        href: '/admin/richieste-sessioni',
        label: 'Richieste Sessioni',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Analisi',
    items: [
      {
        href: '/admin/analytics',
        label: 'Analytics',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M18 20V10M12 20V4M6 20v-6" />
          </svg>
        ),
      },
    ],
  },
];

/* ── Component ── */

interface AdminSidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onCollapseToggle: () => void;
}

export function AdminSidebar({ open, collapsed, onClose, onCollapseToggle }: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(href + '/');
  }

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
          'fixed top-0 left-0 z-40 h-screen bg-surface-1 border-r border-border-subtle',
          'flex flex-col transition-all duration-200 shrink-0',
          'lg:translate-x-0 lg:sticky lg:z-30',
          collapsed ? 'lg:w-[68px]' : 'lg:w-[200px]',
          'w-[200px]',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand + Admin badge */}
        <div className={cn(
          'border-b border-border-subtle transition-all duration-200 flex items-center h-[62px]',
          collapsed ? 'px-3 justify-center' : 'px-5 justify-between',
        )}>
          <Link href="/admin" onClick={onClose} className="block min-w-0">
            {collapsed ? (
              <span className="font-heading text-[1.2rem] font-extrabold text-accent-amber">A</span>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-[1.3rem] font-bold tracking-tight text-text-primary">
                  Aer<span className="text-accent-cyan font-extrabold">ACADEMY</span>
                </h1>
                <span className="bg-accent-amber/15 text-accent-amber text-[0.55rem] font-bold font-heading uppercase tracking-wider px-1.5 py-[1px] rounded">
                  Admin
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onCollapseToggle}
          className="hidden lg:flex absolute top-[52px] -right-3 z-50 items-center justify-center w-6 h-6 rounded-full bg-surface-1 border border-border-subtle text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors shadow-sm"
          aria-label={collapsed ? 'Espandi sidebar' : 'Comprimi sidebar'}
        >
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            className={cn('transition-transform duration-200', collapsed && 'rotate-180')}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Navigation */}
        <nav className={cn(
          'flex-1 py-3.5 flex flex-col gap-px overflow-y-auto scrollbar-thin',
          collapsed ? 'px-1.5' : 'px-3',
        )}>
          {ADMIN_SECTIONS.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <div className="font-heading text-[0.62rem] uppercase tracking-[0.16em] text-text-muted px-3 pt-[18px] pb-2 font-bold">
                  {section.title}
                </div>
              )}
              {collapsed && <div className="pt-2" />}
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'relative flex items-center rounded-sm text-[0.82rem] font-medium transition-all select-none',
                      collapsed
                        ? 'justify-center px-0 py-2.5'
                        : 'gap-[11px] px-3.5 py-2.5',
                      active
                        ? 'bg-accent-amber/8 text-accent-amber'
                        : 'text-text-secondary hover:bg-[rgba(157,177,191,0.05)] hover:text-text-primary',
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-accent-amber rounded-r" />
                    )}
                    <span className="w-5 h-5 flex items-center justify-center shrink-0">
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Back to dashboard link */}
        <div className={cn(
          'border-t border-border-subtle h-[60px] flex items-center',
          collapsed ? 'px-1.5 justify-center' : 'px-3.5',
        )}>
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center rounded-sm text-[0.82rem] font-medium text-text-secondary hover:text-text-primary transition-colors',
              collapsed ? 'justify-center p-2.5' : 'gap-[11px] p-2.5 w-full',
            )}
            title={collapsed ? 'Torna alla Dashboard' : undefined}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {!collapsed && <span>Torna alla Dashboard</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
