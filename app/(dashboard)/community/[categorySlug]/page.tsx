import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { hasActiveCommunityAccess, getCategoryBySlug, getDiscussions } from '@/lib/community/queries';
import { DiscussionFeed } from '@/components/community/DiscussionFeed';
import { CommunityGate } from '@/components/community/CommunityGate';

interface CategoryPageProps {
  params: { categorySlug: string };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const isPro = await hasActiveCommunityAccess(supabase, user.id);

  if (!isPro) {
    return (
      <div className="w-full px-6 lg:px-9 py-7">
        <CommunityGate />
      </div>
    );
  }

  const category = await getCategoryBySlug(supabase, params.categorySlug);
  if (!category) {
    notFound();
  }

  const { discussions, total } = await getDiscussions(supabase, user.id, {
    categoryId: category.id,
    limit: 20,
  });

  return (
    <div className="w-full px-6 lg:px-9 py-7">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[0.75rem] text-text-muted mb-4">
        <Link href="/community" className="hover:text-text-secondary transition-colors">
          Community
        </Link>
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span className="text-text-secondary">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary flex items-center gap-2">
            <span>{category.emoji}</span>
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-1.5 text-text-secondary text-[0.84rem]">
              {category.description}
            </p>
          )}
        </div>
        <Link
          href={`/community/nuova-discussione?category=${category.id}`}
          className="shrink-0 flex items-center gap-2 bg-surface-2 border border-border-subtle hover:border-accent-cyan text-text-secondary hover:text-accent-cyan px-4 py-2.5 rounded-sm text-[0.78rem] font-semibold transition-all"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nuova discussione
        </Link>
      </div>

      {/* Discussion feed */}
      <DiscussionFeed
        discussions={discussions}
        total={total}
        showCategory={false}
        categoryId={category.id}
      />
    </div>
  );
}
