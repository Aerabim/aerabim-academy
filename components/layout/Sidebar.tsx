'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createBrowserClient } from '@/lib/supabase/client';
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

function buildSections(courseCount: number): SidebarNavSection[] {
  return [
  {
    title: 'Formazione',
    items: [
      {
        href: '/catalogo-corsi',
        label: 'Catalogo Corsi',
        badge: courseCount > 0 ? String(courseCount) : undefined,
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
        ),
      },
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
    title: 'Il Mio Spazio',
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
        href: '/preferiti',
        label: 'Preferiti',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
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
    ],
  },
  {
    title: 'Strumenti',
    items: [
      {
        href: '/ai-tutor',
        label: 'AI Tutor',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M12 2a4 4 0 014 4c0 1.95-1.4 3.58-3.25 3.93" />
            <path d="M8.24 9.93A4 4 0 0112 2" />
            <path d="M12 15v7" />
            <path d="M8 18h8" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ),
      },
      {
        href: '/notifiche',
        label: 'Notifiche',
        icon: (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        ),
      },
      {
        href: '/assistenza',
        label: 'Assistenza',
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
  ];
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Piano Free',
  pro: 'Piano Pro',
  team: 'Piano Team',
  pa: 'Piano PA',
};

/* ── Component ── */

interface SidebarProps {
  user: DashboardUser;
  courseCount: number;
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onCollapseToggle: () => void;
}

export function Sidebar({ user, courseCount, open, collapsed, onClose, onCollapseToggle }: SidebarProps) {
  const pathname = usePathname();
  const sections = buildSections(courseCount);

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
          collapsed ? 'lg:w-[68px]' : 'lg:w-[260px]',
          'w-[260px]',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand + collapse toggle */}
        <div className={cn(
          'border-b border-border-subtle transition-all duration-200 flex items-center h-[62px]',
          collapsed ? 'px-3 justify-center' : 'px-5 justify-between',
        )}>
          <Link href="/dashboard" onClick={onClose} className="block min-w-0">
            {collapsed ? (
              <span className="font-heading text-[1.2rem] font-extrabold text-accent-cyan">A</span>
            ) : (
              <h1 className="font-heading text-[1.45rem] font-bold tracking-tight text-text-primary">
                Aer<span className="text-accent-cyan font-extrabold">ACADEMY</span>
              </h1>
            )}
          </Link>

        </div>

        {/* Collapse toggle — desktop only, floating circle on sidebar edge */}
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
          {sections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <div className="font-heading text-[0.62rem] uppercase tracking-[0.16em] text-text-muted px-3 pt-[18px] pb-2 font-bold">
                  {section.title}
                </div>
              )}
              {collapsed && <div className="pt-2" />}
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && item.badge && (
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

        {/* User card with popover */}
        <UserMenu user={user} collapsed={collapsed} onClose={onClose} />
      </aside>
    </>
  );
}

/* ── User popover menu ── */

function UserMenu({
  user,
  collapsed,
  onClose,
}: {
  user: DashboardUser;
  collapsed: boolean;
  onClose: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on click outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

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

  const menuItems = [
    {
      href: '/profilo',
      label: 'Profilo',
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      href: '/impostazioni',
      label: 'Impostazioni',
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <div ref={menuRef} className={cn(
      'relative border-t border-border-subtle',
      collapsed ? 'px-1.5 py-3.5' : 'px-3.5 py-3.5',
    )}>
      {/* Popover */}
      {menuOpen && (
        <div className={cn(
          'absolute bottom-full mb-2 bg-surface-1 border border-border-subtle rounded-lg shadow-lg overflow-hidden',
          'animate-fadeIn',
          collapsed ? 'left-1 w-[200px]' : 'left-2 right-2',
        )}>
          {/* User info header */}
          <div className="px-3.5 py-3 border-b border-border-subtle">
            <div className="text-[0.8rem] font-semibold text-text-primary truncate">
              {user.fullName}
            </div>
            <div className="text-[0.67rem] text-accent-cyan font-semibold font-heading flex items-center gap-1 mt-0.5">
              <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              {PLAN_LABELS[user.plan] || 'Piano Free'}
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => { setMenuOpen(false); onClose(); }}
                className="flex items-center gap-2.5 px-3.5 py-2 text-[0.8rem] text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
              >
                <span className="w-4 h-4 flex items-center justify-center shrink-0">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-border-subtle py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[0.8rem] text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <span className="w-4 h-4 flex items-center justify-center shrink-0">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
              Esci
            </button>
          </div>
        </div>
      )}

      {/* Avatar trigger */}
      <button
        onClick={() => setMenuOpen((o) => !o)}
        title={collapsed ? user.fullName : undefined}
        className={cn(
          'w-full flex items-center rounded-sm transition-colors hover:bg-[rgba(157,177,191,0.05)]',
          collapsed ? 'justify-center p-2.5' : 'gap-[11px] p-2.5',
        )}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-cyan to-brand-blue flex items-center justify-center font-heading text-[0.78rem] font-extrabold text-brand-dark shrink-0">
          {user.initials}
        </div>
        {!collapsed && (
          <>
            <div className="overflow-hidden text-left flex-1">
              <div className="text-[0.8rem] font-semibold text-text-primary truncate">
                {user.fullName}
              </div>
            </div>
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              className={cn(
                'text-text-muted shrink-0 transition-transform duration-200',
                menuOpen && 'rotate-180',
              )}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 15l-6-6-6 6" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
