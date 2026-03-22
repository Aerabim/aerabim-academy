import { Badge } from '@/components/ui/Badge';
import type { CommunityAuthor } from '@/types';

interface AuthorBadgeProps {
  author: CommunityAuthor;
  showCerts?: boolean;
  size?: 'sm' | 'md';
}

const planLabels: Record<string, string> = {
  pro: 'Pro',
  team: 'Team',
  pa: 'PA',
};

const planColors: Record<string, 'cyan' | 'amber' | 'violet' | 'emerald'> = {
  pro: 'cyan',
  team: 'amber',
  pa: 'violet',
};

export function AuthorBadge({ author, showCerts = false, size = 'sm' }: AuthorBadgeProps) {
  const avatarSize = size === 'md' ? 'w-9 h-9 text-[0.7rem]' : 'w-7 h-7 text-[0.6rem]';

  return (
    <div className="flex items-center gap-2">
      {/* Avatar */}
      <div
        className={`${avatarSize} rounded-full bg-surface-3 border border-border-subtle flex items-center justify-center font-heading font-bold text-text-secondary shrink-0`}
      >
        {author.initials}
      </div>

      {/* Name + badges */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[0.78rem] font-medium text-text-primary truncate">
            {author.displayName}
          </span>
          {author.plan !== 'free' && planLabels[author.plan] && (
            <Badge variant={planColors[author.plan] ?? 'cyan'}>
              {planLabels[author.plan]}
            </Badge>
          )}
        </div>
        {showCerts && author.certificateCount > 0 && (
          <span className="text-[0.65rem] text-text-muted">
            {author.certificateCount} {author.certificateCount === 1 ? 'certificato' : 'certificati'}
          </span>
        )}
      </div>
    </div>
  );
}
