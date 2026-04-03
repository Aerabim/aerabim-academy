import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getLiveSessions, hasActiveProSubscription } from '@/lib/live/queries';
import { SessionList } from '@/components/live/SessionList';
import { ProGate } from '@/components/live/ProGate';
import { SessioniLiveHeader } from '@/components/live/SessioniLiveHeader';

export default async function SessioniLivePage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [isPro, sessions] = await Promise.all([
    hasActiveProSubscription(supabase, user.id),
    getLiveSessions(supabase, user.id),
  ]);

  return (
    <div className="w-full px-6 lg:px-9 pt-3 pb-7 space-y-6">
      <SessioniLiveHeader showRequestButton={isPro} />

      {!isPro && <ProGate />}

      <SessionList sessions={sessions} isPro={isPro} />
    </div>
  );
}
