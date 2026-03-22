import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { hasActiveCommunityAccess } from '@/lib/community/queries';
import { NewDiscussionForm } from '@/components/community/NewDiscussionForm';
import { CommunityGate } from '@/components/community/CommunityGate';
import type { CommunityCategory } from '@/types';

interface NewDiscussionPageProps {
  searchParams: { category?: string };
}

export default async function NewDiscussionPage({ searchParams }: NewDiscussionPageProps) {
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

  const { data: rawCategories } = await supabase
    .from('community_categories')
    .select('id, slug, name, description, order_num, emoji')
    .order('order_num', { ascending: true });

  const categories = (rawCategories ?? []) as unknown as CommunityCategory[];

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
        <span className="text-text-secondary">Nuova discussione</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-xl font-bold text-text-primary">
          Nuova discussione
        </h1>
        <p className="mt-1.5 text-text-secondary text-[0.84rem]">
          Condividi una domanda, esperienza o argomento con la community.
        </p>
      </div>

      {/* Form */}
      <div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-6">
          <NewDiscussionForm
            categories={categories}
            defaultCategoryId={searchParams.category}
          />
        </div>
      </div>
    </div>
  );
}
