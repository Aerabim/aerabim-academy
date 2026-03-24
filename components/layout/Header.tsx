'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Breadcrumb } from './Breadcrumb';
import type { Notification, NotificationType } from '@/types';

/** Pages where the search bar is shown */
const SEARCH_ROUTES = ['/catalogo-corsi', '/i-miei-corsi', '/dashboard'];

const TYPE_ICONS: Record<NotificationType, string> = {
  welcome: '\u{1F44B}',
  purchase_confirmed: '\u2705',
  subscription_activated: '\u2B50',
  subscription_canceled: '\u{1F4CB}',
  certificate_issued: '\u{1F393}',
  session_booked: '\u{1F4C5}',
  session_reminder: '\u{1F514}',
  session_canceled: '\u274C',
  enrollment_granted: '\u{1F381}',
  refund_processed: '\u{1F4B6}',
  admin_message: '\u{1F4E2}',
};

interface HeaderProps {
  onMenuToggle: () => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  unreadNotifications?: number;
  recentNotifications?: Notification[];
}

export function Header({
  onMenuToggle,
  onSearch,
  searchQuery = '',
  unreadNotifications = 0,
  recentNotifications = [],
}: HeaderProps) {
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

      {/* Header actions */}
      <div className="flex items-center gap-1">
        <NotificationBell
          unreadCount={unreadNotifications}
          notifications={recentNotifications}
        />
        <Link
          href="/assistenza"
          className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2/50 rounded-md transition-colors"
          title="Assistenza"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </Link>
      </div>
    </header>
  );
}

// ── Notification Bell with Hover Popover ─────────────

function NotificationBell({
  unreadCount,
  notifications,
}: {
  unreadCount: number;
  notifications: Notification[];
}) {
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleEnter() {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setOpen(true);
  }

  function handleLeave() {
    closeTimeout.current = setTimeout(() => setOpen(false), 200);
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link
        href="/notifiche"
        className="relative p-2 text-text-muted hover:text-text-primary hover:bg-surface-2/50 rounded-md transition-colors flex items-center"
        title="Notifiche"
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-accent-cyan text-brand-dark text-[10px] font-bold px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>

      {/* Hover popover */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-surface-1 border border-border-subtle rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">Notifiche</span>
            {unreadCount > 0 && (
              <span className="text-xs text-accent-cyan">{unreadCount} nuove</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-text-muted">
              Nessuna notifica
            </div>
          ) : (
            <div className="max-h-[320px] overflow-y-auto">
              {notifications.map((n) => (
                <NotificationPreviewItem key={n.id} notification={n} onClose={() => setOpen(false)} />
              ))}
            </div>
          )}

          <Link
            href="/notifiche"
            className="block px-4 py-2.5 text-center text-xs font-medium text-accent-cyan hover:bg-surface-2/50 border-t border-border-subtle transition-colors"
          >
            Vedi tutte le notifiche
          </Link>
        </div>
      )}
    </div>
  );
}

function NotificationPreviewItem({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) {
  const icon = TYPE_ICONS[notification.type] ?? '\u{1F4CC}';
  const timeAgo = formatTimeAgo(notification.created_at);

  const content = (
    <div
      className={cn(
        'flex items-start gap-2.5 px-4 py-3 hover:bg-surface-2/40 transition-colors cursor-pointer',
        !notification.is_read && 'bg-accent-cyan/5',
      )}
    >
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-xs leading-relaxed line-clamp-2',
          notification.is_read ? 'text-text-secondary' : 'text-text-primary font-medium',
        )}>
          {notification.title}
        </p>
        <p className="text-[10px] text-text-muted/60 mt-1">{timeAgo}</p>
      </div>
      {!notification.is_read && (
        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-accent-cyan mt-1.5" />
      )}
    </div>
  );

  if (notification.href) {
    return (
      <Link href={notification.href} onClick={onClose}>
        {content}
      </Link>
    );
  }

  return content;
}

// ── Header Search ────────────────────────────────────

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

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Adesso';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min fa`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ore fa`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}g fa`;

  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  });
}
