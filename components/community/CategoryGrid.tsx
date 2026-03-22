import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { timeAgo } from '@/lib/utils';
import type { CommunityCategoryDisplay, AccentColor } from '@/types';

interface CategoryGridProps {
  categories: CommunityCategoryDisplay[];
}

const categoryColors: Record<string, AccentColor> = {
  generale: 'cyan',
  SW: 'cyan',
  NL: 'violet',
  OB: 'emerald',
  PG: 'amber',
  AI: 'cyan',
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((cat, i) => (
        <Link
          key={cat.id}
          href={`/community/${cat.slug}`}
          className="block"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <Card
            topBorder={categoryColors[cat.id] ?? 'cyan'}
            className="h-full animate-fadeIn"
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-[0.68rem] text-text-muted font-medium">
                  {cat.discussionCount} {cat.discussionCount === 1 ? 'discussione' : 'discussioni'}
                </span>
              </div>

              <h3 className="font-heading text-[0.9rem] font-bold text-text-primary mb-1">
                {cat.name}
              </h3>

              {cat.description && (
                <p className="text-[0.75rem] text-text-secondary line-clamp-2 mb-3">
                  {cat.description}
                </p>
              )}

              {cat.latestDiscussionTitle ? (
                <div className="text-[0.68rem] text-text-muted truncate">
                  Ultima: {cat.latestDiscussionTitle}
                  {cat.latestDiscussionAt && (
                    <span className="ml-1">· {timeAgo(cat.latestDiscussionAt)}</span>
                  )}
                </div>
              ) : (
                <div className="text-[0.68rem] text-text-muted italic">
                  Nessuna discussione ancora
                </div>
              )}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
