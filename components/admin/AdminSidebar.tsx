'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AuroraBorder } from '@/components/layout/AuroraBorder';
import type { DashboardUser } from '@/types';

/* ── Navigation ── */

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string | null;  // null = no section header
  color: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: null,
    color: '',
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
    title: 'Utenti',
    color: 'text-accent-cyan/60',
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
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <polyline points="16 11 18 13 22 9" />
          </svg>
        ),
      },
      {
        href: '/admin/richieste-sessioni',
        label: 'Richieste',
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
    title: 'Didattica',
    color: 'text-accent-amber/60',
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
        href: '/admin/learning-paths',
        label: 'Percorsi',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <circle cx="5"  cy="12" r="2" />
            <circle cx="12" cy="5"  r="2" />
            <circle cx="19" cy="12" r="2" />
            <path strokeLinecap="round" d="M7 12h3.5M14 7l1.5 3.5M16.5 12H17" />
          </svg>
        ),
      },
      {
        href: '/admin/simulazioni',
        label: 'Simulazioni',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
        ),
      },
      {
        href: '/admin/sessioni-live',
        label: 'Aule Virtuali',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8"  y1="2" x2="8"  y2="6" />
            <line x1="3"  y1="10" x2="21" y2="10" />
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
    title: 'Community',
    color: 'text-accent-emerald/60',
    items: [
      {
        href: '/admin/feed',
        label: 'Feed',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
            <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" />
            <circle cx="12" cy="12" r="2" />
            <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" />
            <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
          </svg>
        ),
      },
      {
        href: '/admin/community',
        label: 'Discussioni',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Promozioni',
    color: 'text-accent-violet/60',
    items: [
      {
        href: '/admin/coupon',
        label: 'Coupon',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        ),
      },
      {
        href: '/admin/promozioni',
        label: 'Promozioni',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ),
      },
      {
        href: '/admin/comunicazioni',
        label: 'Comunicazioni',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Report',
    color: 'text-accent-rose/60',
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
  user: DashboardUser;
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onCollapseToggle: () => void;
}

export function AdminSidebar({ user, open, collapsed, onClose, onCollapseToggle }: AdminSidebarProps) {
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
          'fixed top-0 left-0 z-40 h-screen bg-surface-1',
          'flex flex-col transition-all duration-200 shrink-0',
          'lg:translate-x-0 lg:sticky lg:z-30',
          collapsed ? 'lg:w-[68px]' : 'lg:w-[200px]',
          'w-[200px]',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <AuroraBorder variant="amber" />

        {/* Brand */}
        <div className={cn(
          'border-b border-border-subtle transition-all duration-200 flex items-center h-[62px]',
          collapsed ? 'px-3 justify-center' : 'px-5 justify-between',
        )}>
          <Link href="/admin" onClick={onClose} className="block min-w-0">
            {collapsed ? (
              <span className="font-heading text-[1.2rem] font-extrabold text-accent-amber">A</span>
            ) : (
              <div className="flex flex-col gap-0.5">
                <h1 className="font-heading text-[1.3rem] font-bold tracking-tight text-text-primary leading-none">
                  Aer<span className="text-accent-cyan font-extrabold">ACADEMY</span>
                </h1>
                <span className="font-heading text-[0.58rem] tracking-[0.22em] uppercase text-accent-amber/70 font-bold">
                  Admin
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onCollapseToggle}
          className="hidden lg:flex absolute top-[52px] -right-3 z-50 items-center justify-center w-6 h-6 rounded-full bg-surface-1 border border-border-subtle text-text-muted hover:text-accent-amber hover:bg-surface-2 transition-colors shadow-sm"
          aria-label={collapsed ? 'Espandi sidebar' : 'Comprimi sidebar'}
        >
          <svg
            width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
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
          {SECTIONS.map((section, si) => (
            <div key={si}>
              {section.title !== null && !collapsed && (
                <div className={cn(
                  'font-heading text-[0.62rem] uppercase tracking-[0.16em] px-3 pt-[18px] pb-2 font-bold',
                  section.color,
                )}>
                  {section.title}
                </div>
              )}
              {collapsed && si > 0 && <div className="pt-2" />}
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'group/item relative flex items-center rounded-sm text-[0.82rem] font-medium transition-all select-none',
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
                    <span className="w-5 h-5 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover/item:scale-110 group-hover/item:-rotate-6">
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer — user info + back to dashboard */}
        <div className={cn(
          'border-t border-border-subtle',
          collapsed ? 'px-1.5 py-3 flex flex-col items-center gap-3' : 'px-3.5 py-3',
        )}>
          {/* User row */}
          {collapsed ? (
            <div
              className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-amber to-brand-blue flex items-center justify-center font-heading text-[0.78rem] font-extrabold text-brand-dark"
              title={user.fullName}
            >
              {user.initials}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-1 py-1 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-amber to-brand-blue flex items-center justify-center font-heading text-[0.72rem] font-extrabold text-brand-dark shrink-0">
                {user.initials}
              </div>
              <div className="overflow-hidden flex-1">
                <div className="text-[0.72rem] font-semibold text-text-primary truncate leading-tight">
                  {user.fullName}
                </div>
                <div className="text-[0.6rem] text-accent-amber font-bold uppercase tracking-wide mt-0.5">
                  Admin
                </div>
              </div>
            </div>
          )}

          {/* Back to dashboard */}
          <Link
            href="/dashboard"
            title={collapsed ? 'Torna alla Dashboard' : undefined}
            className={cn(
              'flex items-center rounded-sm text-[0.78rem] font-medium text-text-muted hover:text-text-primary transition-colors',
              collapsed ? 'justify-center p-2' : 'gap-2.5 px-2 py-2 w-full hover:bg-[rgba(157,177,191,0.05)]',
            )}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {!collapsed && <span>Torna alla Dashboard</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
