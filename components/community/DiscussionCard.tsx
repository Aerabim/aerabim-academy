import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AuthorBadge } from '@/components/community/AuthorBadge';
import { timeAgo } from '@/lib/utils';
import type { CommunityDiscussionDisplay } from '@/types';

interface DiscussionCardProps {
  discussion: CommunityDiscussionDisplay;
  showCategory?: boolean;
}

export function DiscussionCard({ discussion, showCategory = true }: DiscussionCardProps) {
  return (
    <Card>
      <Link
        href={`/community/${discussion.categorySlug}/${discussion.id}`}
        className="block p-5 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Top row: badges */}
            <div className="flex items-center gap-2 mb-1.5">
              {discussion.isPinned && (
                <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold text-accent-amber uppercase tracking-wider">
                  <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                  </svg>
                  In evidenza
                </span>
              )}
              {discussion.isLocked && (
                <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold text-text-muted uppercase tracking-wider">
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  Chiusa
                </span>
              )}
              {showCategory && (
                <Badge variant="cyan">{discussion.categoryName}</Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="text-[0.88rem] font-semibold text-text-primary line-clamp-1 mb-1">
              {discussion.title}
            </h3>

            {/* Body preview */}
            <p className="text-[0.75rem] text-text-secondary line-clamp-2 mb-2.5">
              {discussion.body}
            </p>

            {/* Bottom row: author + stats */}
            <div className="flex items-center justify-between">
              <AuthorBadge author={discussion.author} />

              <div className="flex items-center gap-3 text-[0.7rem] text-text-muted shrink-0">
                {/* Replies */}
                <span className="inline-flex items-center gap-1">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  {discussion.replyCount}
                </span>

                {/* Likes */}
                <span className="inline-flex items-center gap-1">
                  <svg width="13" height="13" fill={discussion.isLikedByUser ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className={discussion.isLikedByUser ? 'text-accent-rose' : ''}>
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                  {discussion.likeCount}
                </span>

                {/* Time */}
                <span>{timeAgo(discussion.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="shrink-0 text-text-muted mt-1">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </Link>
    </Card>
  );
}
