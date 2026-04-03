'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { RelativeTime } from './RelativeTime';
import type { FeedItem, FeedItemAdminPost, FeedItemProgress, FeedItemCertificate, FeedItemEnrollment, FeedItemDiscussion } from '@/types';

/* ── Avatar ── */
function Avatar({ initials, type }: { initials: string; type: string }) {
  const colorMap: Record<string, string> = {
    progress:    'bg-accent-cyan/15 text-accent-cyan',
    certificate: 'bg-accent-amber/15 text-accent-amber',
    enrollment:  'bg-accent-emerald/15 text-accent-emerald',
    discussion:  'bg-accent-violet/15 text-accent-violet',
    admin_post:  'bg-accent-cyan/15 text-accent-cyan',
  };
  return (
    <div className={cn(
      'w-9 h-9 rounded-full flex items-center justify-center text-[0.72rem] font-bold shrink-0 select-none',
      colorMap[type] ?? 'bg-surface-3 text-text-muted',
    )}>
      {initials}
    </div>
  );
}

/* ── Type badge ── */
const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  progress:    { label: 'Progresso',  color: 'text-accent-cyan   bg-accent-cyan/8'   },
  certificate: { label: 'Certificato',color: 'text-accent-amber  bg-accent-amber/8'  },
  enrollment:  { label: 'Iscrizione', color: 'text-accent-emerald bg-accent-emerald/8'},
  discussion:  { label: 'Discussione',color: 'text-accent-violet bg-accent-violet/8' },
  admin_post:  { label: 'AERABIM',    color: 'text-accent-cyan   bg-accent-cyan/8'   },
};

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type];
  if (!cfg) return null;
  return (
    <span className={cn('text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded', cfg.color)}>
      {cfg.label}
    </span>
  );
}

/* ── Action text per type ── */
function actionText(item: FeedItem): React.ReactNode {
  switch (item.type) {
    case 'progress': {
      const p = item as FeedItemProgress;
      return (
        <>
          ha completato la lezione{' '}
          <Link href={`/catalogo-corsi/${p.courseSlug}`} className="font-semibold text-text-primary hover:text-accent-cyan transition-colors">
            {p.lessonTitle}
          </Link>
          {' '}nel corso{' '}
          <span className="text-text-secondary">{p.courseTitle}</span>
        </>
      );
    }
    case 'certificate': {
      const c = item as FeedItemCertificate;
      return (
        <>
          ha conseguito il certificato per{' '}
          <Link href={`/catalogo-corsi/${c.courseSlug}`} className="font-semibold text-text-primary hover:text-accent-cyan transition-colors">
            {c.courseTitle}
          </Link>
        </>
      );
    }
    case 'enrollment': {
      const e = item as FeedItemEnrollment;
      return (
        <>
          si è iscritto a{' '}
          <Link href={`/catalogo-corsi/${e.courseSlug}`} className="font-semibold text-text-primary hover:text-accent-cyan transition-colors">
            {e.courseTitle}
          </Link>
        </>
      );
    }
    case 'discussion': {
      const d = item as FeedItemDiscussion;
      return (
        <>
          ha aperto{' '}
          <Link href={`/community/${d.discussionId}`} className="font-semibold text-text-primary hover:text-accent-cyan transition-colors">
            {d.discussionTitle}
          </Link>
          {d.replyCount > 0 && (
            <span className="ml-2 text-[0.7rem] text-accent-violet font-medium">
              {d.replyCount} {d.replyCount === 1 ? 'risposta' : 'risposte'}
            </span>
          )}
        </>
      );
    }
    default:
      return null;
  }
}

/* ── Admin post card ── */
function AdminPostCard({ item }: { item: FeedItemAdminPost }) {
  return (
    <div className={cn(
      'relative rounded-lg border px-5 py-4',
      'bg-surface-1 border-accent-cyan/25',
      item.isPinned && 'border-accent-cyan/40',
    )}>
      {/* Cyan left accent */}
      <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-accent-cyan rounded-r" />

      <div className="flex items-start gap-3">
        <Avatar initials="A" type="admin_post" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[0.78rem] font-bold text-accent-cyan">AERABIM</span>
            <TypeBadge type="admin_post" />
            {item.isPinned && (
              <span className="text-[0.6rem] text-accent-amber font-bold uppercase tracking-wider">📌 Fissato</span>
            )}
            <RelativeTime date={item.createdAt} className="text-[0.7rem] text-text-muted ml-auto" />
          </div>
          <p className="text-[0.88rem] font-semibold text-text-primary mt-1">{item.title}</p>
          <p className="text-[0.78rem] text-text-secondary mt-1 leading-relaxed">{item.body}</p>
          {item.href && (
            <Link
              href={item.href}
              className="inline-flex items-center gap-1 mt-2 text-[0.76rem] text-accent-cyan hover:underline font-medium"
            >
              Scopri di più
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Regular activity card ── */
function ActivityCard({ item }: { item: FeedItem }) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-border-subtle last:border-0">
      <Avatar initials={item.authorInitials} type={item.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-[0.8rem] font-semibold text-text-primary">{item.authorName}</span>
          <TypeBadge type={item.type} />
          <RelativeTime date={item.createdAt} className="text-[0.7rem] text-text-muted ml-auto shrink-0" />
        </div>
        <p className="text-[0.78rem] text-text-secondary leading-relaxed">
          {actionText(item)}
        </p>
      </div>
    </div>
  );
}

/* ── Public export ── */
export function FeedItemCard({ item }: { item: FeedItem }) {
  if (item.type === 'admin_post') {
    return <AdminPostCard item={item as FeedItemAdminPost} />;
  }
  return <ActivityCard item={item} />;
}
