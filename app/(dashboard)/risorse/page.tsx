import { createServerClient } from '@/lib/supabase/server';
import { RisorseTabs } from '@/components/risorse/RisorseTabs';
import { getPublishedArticles, getPublishedPressMentions } from '@/lib/risorse/queries';
import { RisorseHeader } from '@/components/risorse/RisorseHeader';

export default async function RisorsePage() {
  const supabase = createServerClient();

  const [articles, pressMentions] = await Promise.all([
    getPublishedArticles(supabase),
    getPublishedPressMentions(supabase),
  ]);

  return (
    <div className="w-full px-6 lg:px-9 pt-3 pb-7 space-y-6">
      <RisorseHeader />
      <RisorseTabs articles={articles} pressMentions={pressMentions} />
    </div>
  );
}
