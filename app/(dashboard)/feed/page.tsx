import { createServerClient } from '@/lib/supabase/server';
import { FeedView } from '@/components/feed/FeedView';
import { BimAlertBanner } from '@/components/dashboard/BimAlertBanner';
import type { FeedPrivacy } from '@/types';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let showOnline = true;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('feed_privacy')
      .eq('id', user.id)
      .maybeSingle();

    const privacy = (data as { feed_privacy: FeedPrivacy } | null)?.feed_privacy;
    if (privacy) showOnline = privacy.show_online;
  }

  return (
    <div className="p-6 lg:p-10 w-full space-y-8">
      <div>
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">Feed</h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">
          Le ultime novità dalla piattaforma: progressi, iscrizioni, certificati e discussioni.
        </p>
      </div>
      <BimAlertBanner />
      <FeedView showOnline={showOnline} />
    </div>
  );
}
