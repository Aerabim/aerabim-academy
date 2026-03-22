import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getLiveSessions, hasActiveProSubscription } from '@/lib/live/queries';
import { SessionList } from '@/components/live/SessionList';
import { ProGate } from '@/components/live/ProGate';

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
    <div className="w-full px-6 lg:px-9 py-7">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          Sessioni <span className="gradient-text-cyan">Live</span>
        </h1>
        <p className="mt-1.5 text-text-secondary text-[0.84rem]">
          Webinar di gruppo e mentoring 1-to-1 con il team AERABIM.
        </p>
      </div>

      {!isPro && (
        <div className="mb-6">
          <ProGate />
        </div>
      )}

      <SessionList sessions={sessions} isPro={isPro} />
    </div>
  );
}
