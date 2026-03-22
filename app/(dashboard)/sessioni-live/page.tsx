import { redirect } from 'next/navigation';
import Link from 'next/link';
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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Sessioni <span className="gradient-text-cyan">Live</span>
          </h1>
          <p className="mt-1.5 text-text-secondary text-[0.84rem]">
            Webinar di gruppo e mentoring 1-to-1 con il team AERABIM.
          </p>
        </div>
        {isPro && (
          <Link
            href="/sessioni-live/richiedi"
            className="shrink-0 flex items-center gap-2 bg-surface-2 border border-border-subtle hover:border-accent-cyan text-text-secondary hover:text-accent-cyan px-4 py-2.5 rounded-sm text-[0.78rem] font-semibold transition-all"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Richiedi sessione
          </Link>
        )}
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
