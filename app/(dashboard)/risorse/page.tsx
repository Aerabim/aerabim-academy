import { createServerClient } from '@/lib/supabase/server';
import { RisorseTabs } from '@/components/risorse/RisorseTabs';
import { getPublishedArticles, getPublishedPressMentions } from '@/lib/risorse/queries';

export default async function RisorsePage() {
  const supabase = createServerClient();

  const [articles, pressMentions] = await Promise.all([
    getPublishedArticles(supabase),
    getPublishedPressMentions(supabase),
  ]);

  return (
    <div className="w-full px-6 lg:px-9 py-7">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-xl lg:text-[1.65rem] font-extrabold text-text-primary leading-tight mb-2">
          Risorse
        </h1>
        <p className="text-text-secondary text-[0.82rem]">
          Articoli tecnici, approfondimenti BIM e rassegna stampa AERABIM.
        </p>
      </div>

      {/* Tabs: Articoli + Press */}
      <RisorseTabs articles={articles} pressMentions={pressMentions} />
    </div>
  );
}
