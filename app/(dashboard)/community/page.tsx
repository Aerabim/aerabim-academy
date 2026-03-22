import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { hasActiveCommunityAccess, getCategories, getDiscussions } from '@/lib/community/queries';
import { CategoryGrid } from '@/components/community/CategoryGrid';
import { DiscussionFeed } from '@/components/community/DiscussionFeed';
import { CommunityGate } from '@/components/community/CommunityGate';

export default async function CommunityPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const isPro = await hasActiveCommunityAccess(supabase, user.id);

  if (!isPro) {
    return (
      <div className="w-full px-6 lg:px-9 py-7">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            La <span className="gradient-text-cyan">Community</span>
          </h1>
          <p className="mt-1.5 text-text-secondary text-[0.84rem]">
            Connettiti con altri professionisti AEC.
          </p>
        </div>
        <CommunityGate />
      </div>
    );
  }

  const [categories, { discussions, total }] = await Promise.all([
    getCategories(supabase),
    getDiscussions(supabase, user.id, { limit: 10 }),
  ]);

  return (
    <div className="w-full px-6 lg:px-9 py-7">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            La <span className="gradient-text-cyan">Community</span>
          </h1>
          <p className="mt-1.5 text-text-secondary text-[0.84rem]">
            Confrontati con altri professionisti BIM/AEC, condividi esperienze e impara insieme.
          </p>
        </div>
        <Link
          href="/community/nuova-discussione"
          className="shrink-0 flex items-center gap-2 bg-surface-2 border border-border-subtle hover:border-accent-cyan text-text-secondary hover:text-accent-cyan px-4 py-2.5 rounded-sm text-[0.78rem] font-semibold transition-all"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nuova discussione
        </Link>
      </div>

      {/* Category grid */}
      <section className="mb-8">
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
