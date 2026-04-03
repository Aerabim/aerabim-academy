import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { hasActiveCommunityAccess, getCategories, getDiscussions } from '@/lib/community/queries';
import { CategoryGrid } from '@/components/community/CategoryGrid';
import { DiscussionFeed } from '@/components/community/DiscussionFeed';
import { CommunityGate } from '@/components/community/CommunityGate';
import { CommunityLiveHeader } from '@/components/community/CommunityLiveHeader';

export default async function CommunityPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const isPro = await hasActiveCommunityAccess(supabase, user.id);

  if (!isPro) {
    return (
      <div className="w-full px-6 lg:px-9 pt-3 pb-7 space-y-6">
        <CommunityLiveHeader />
        <CommunityGate />
      </div>
    );
  }

  const [categories, { discussions, total }] = await Promise.all([
    getCategories(supabase),
    getDiscussions(supabase, user.id, { limit: 10 }),
  ]);

  return (
    <div className="w-full px-6 lg:px-9 pt-3 pb-7 space-y-6">
      <CommunityLiveHeader showNewButton />

      {/* Category grid */}
      <section>
        <h2 className="font-heading text-[0.92rem] font-bold text-text-primary mb-3">
          Categorie
        </h2>
        <CategoryGrid categories={categories} />
      </section>

      {/* Recent discussions */}
      <section>
        <h2 className="font-heading text-[0.92rem] font-bold text-text-primary mb-3">
          Discussioni recenti
        </h2>
        <DiscussionFeed discussions={discussions} total={total} />
      </section>
    </div>
  );
}
