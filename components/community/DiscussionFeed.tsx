'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DiscussionCard } from '@/components/community/DiscussionCard';
import type { CommunityDiscussionDisplay } from '@/types';

interface DiscussionFeedProps {
  discussions: CommunityDiscussionDisplay[];
  total: number;
  showCategory?: boolean;
  basePath?: string;
  categoryId?: string;
}

export function DiscussionFeed({
  discussions: initialDiscussions,
  total,
  showCategory = true,
  categoryId,
}: DiscussionFeedProps) {
  const [sort, setSort] = useState<'recent' | 'popular'>('recent');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSortChange = (newSort: 'recent' | 'popular') => {
    setSort(newSort);
    const params = new URLSearchParams();
    params.set('sort', newSort);
    if (categoryId) params.set('category', categoryId);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div>
      {/* Sort controls */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => handleSortChange('recent')}
          className={`text-[0.78rem] font-medium px-3 py-1.5 rounded-lg transition-colors ${
            sort === 'recent'
              ? 'bg-surface-3 text-text-primary'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Recenti
        </button>
        <button
          onClick={() => handleSortChange('popular')}
          className={`text-[0.78rem] font-medium px-3 py-1.5 rounded-lg transition-colors ${
            sort === 'popular'
              ? 'bg-surface-3 text-text-primary'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Popolari
        </button>

        <span className="ml-auto text-[0.7rem] text-text-muted">
          {total} {total === 1 ? 'discussione' : 'discussioni'}
        </span>
      </div>

      {/* Discussion list */}
      <div className={`space-y-3 ${isPending ? 'opacity-60' : ''} transition-opacity`}>
        {initialDiscussions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">💬</div>
            <p className="text-text-secondary text-[0.85rem]">
              Nessuna discussione ancora.
            </p>
            <p className="text-text-muted text-[0.75rem] mt-1">
              Sii il primo a iniziare una conversazione!
            </p>
          </div>
        ) : (
          initialDiscussions.map((d, i) => (
            <div
              key={d.id}
              className="animate-fadeIn"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <DiscussionCard discussion={d} showCategory={showCategory} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
