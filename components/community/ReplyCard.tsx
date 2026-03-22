import { AuthorBadge } from '@/components/community/AuthorBadge';
import { LikeButton } from '@/components/community/LikeButton';
import { timeAgo } from '@/lib/utils';
import type { CommunityReplyDisplay } from '@/types';

interface ReplyCardProps {
  reply: CommunityReplyDisplay;
}

export function ReplyCard({ reply }: ReplyCardProps) {
  return (
    <div className="border-b border-border-subtle last:border-b-0 py-4">
      <div className="flex items-start justify-between mb-2">
        <AuthorBadge author={reply.author} showCerts />
        <span className="text-[0.68rem] text-text-muted shrink-0">
          {timeAgo(reply.createdAt)}
        </span>
      </div>

      <div className="pl-9">
        <p className="text-[0.82rem] text-text-primary whitespace-pre-wrap leading-relaxed">
          {reply.body}
        </p>

        <div className="mt-2">
          <LikeButton
            replyId={reply.id}
            initialLiked={reply.isLikedByUser}
            initialCount={reply.likeCount}
          />
        </div>
      </div>
    </div>
  );
}
