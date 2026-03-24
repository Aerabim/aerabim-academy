'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType } from '@/types';

const TYPE_ICONS: Record<NotificationType, { icon: string; color: string }> = {
  welcome: { icon: '👋', color: 'text-accent-cyan' },
  purchase_confirmed: { icon: '✅', color: 'text-emerald-400' },
  subscription_activated: { icon: '⭐', color: 'text-accent-amber' },
  subscription_canceled: { icon: '📋', color: 'text-text-muted' },
  certificate_issued: { icon: '🎓', color: 'text-accent-amber' },
  session_booked: { icon: '📅', color: 'text-accent-cyan' },
  session_reminder: { icon: '🔔', color: 'text-accent-amber' },
  session_canceled: { icon: '❌', color: 'text-rose-400' },
  enrollment_granted: { icon: '🎁', color: 'text-emerald-400' },
  refund_processed: { icon: '💶', color: 'text-text-muted' },
  admin_message: { icon: '📢', color: 'text-accent-cyan' },
};

interface NotificationListProps {
  initialNotifications: Notification[];
  initialUnread: number;
}

export function NotificationList({ initialNotifications, initialUnread }: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [markingAll, setMarkingAll] = useState(false);

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleMarkRead(id: string) {
    const res = await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    });
    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">🔔</div>
        <p className="text-text-muted">Nessuna notifica</p>
      </div>
    );
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-sm text-accent-cyan hover:text-accent-cyan/80 transition-colors disabled:opacity-50"
          >
            Segna tutte come lette
          </button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            onMarkRead={handleMarkRead}
          />
        ))}
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  const typeInfo = TYPE_ICONS[notification.type] ?? { icon: '📌', color: 'text-text-muted' };
  const timeAgo = formatTimeAgo(notification.created_at);

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border transition-colors',
        notification.is_read
          ? 'bg-surface-0 border-border-subtle'
          : 'bg-surface-1 border-accent-cyan/20',
      )}
    >
      <span className={cn('text-xl flex-shrink-0 mt-0.5', typeInfo.color)}>
        {typeInfo.icon}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm',
            notification.is_read ? 'text-text-secondary' : 'text-text-primary font-medium',
          )}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
              className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-accent-cyan mt-1.5"
              title="Segna come letta"
            />
          )}
        </div>
        {notification.body && (
          <p className="text-xs text-text-muted mt-1 line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="text-xs text-text-muted/60 mt-1.5">{timeAgo}</p>
      </div>
    </div>
  );

  if (notification.href) {
    return (
      <Link
        href={notification.href}
        onClick={() => {
          if (!notification.is_read) onMarkRead(notification.id);
        }}
      >
        {content}
      </Link>
    );
  }

  return content;
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Adesso';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min fa`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ore fa`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} giorni fa`;

  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
