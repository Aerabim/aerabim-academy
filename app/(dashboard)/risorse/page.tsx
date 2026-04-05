import { createServerClient } from '@/lib/supabase/server';
import { RisorseTabs } from '@/components/risorse/RisorseTabs';
import { getPublishedArticles, getPublishedPressMentions } from '@/lib/risorse/queries';
import { RisorseHeader } from '@/components/risorse/RisorseHeader';
import { RequestResourceCtaBanner } from '@/components/risorse/RequestResourceCtaBanner';
import type { SupabaseClient } from '@supabase/supabase-js';

export default async function RisorsePage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [articles, pressMentions, favRows] = await Promise.all([
    getPublishedArticles(supabase),
    getPublishedPressMentions(supabase),
    // Fetch favorited article IDs for the current user (if logged in)
    user
      ? (supabase as unknown as SupabaseClient)
          .from('favorites')
          .select('article_id')
          .eq('user_id', user.id)
          .not('article_id', 'is', null)
      : Promise.resolve({ data: [] }),
  ]);

  const favoriteArticleIds = new Set(
    ((favRows.data ?? []) as { article_id: string }[]).map((r) => r.article_id),
  );

  return (
    <div className="w-full px-6 lg:px-9 pt-3 pb-7 space-y-6">
      <RisorseHeader />
      <RisorseTabs
        articles={articles}
        pressMentions={pressMentions}
        favoriteArticleIds={favoriteArticleIds}
      />
      <RequestResourceCtaBanner />
    </div>
  );
}
