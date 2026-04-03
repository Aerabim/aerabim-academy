import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { PrivacySettings } from '@/components/impostazioni/PrivacySettings';
import type { FeedPrivacy } from '@/types';

const DEFAULT_PRIVACY: FeedPrivacy = {
  show_progress: true,
  show_certificates: true,
  show_enrollments: true,
  show_online: true,
};

export default async function ImpostazioniPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data } = await supabase
    .from('profiles')
    .select('feed_privacy')
    .eq('id', user.id)
    .maybeSingle();

  const privacy: FeedPrivacy =
    (data as { feed_privacy: FeedPrivacy } | null)?.feed_privacy ?? DEFAULT_PRIVACY;

  return (
    <div className="w-full px-6 lg:px-9 py-7 space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          Impostazioni
        </h1>
        <p className="mt-1.5 text-text-secondary text-[0.84rem]">
          Gestisci la tua privacy e le preferenze della piattaforma.
        </p>
      </div>

      {/* Sezione Privacy feed */}
      <section className="bg-surface-1 border border-border-subtle rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-accent-cyan/10 flex items-center justify-center shrink-0">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-accent-cyan">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h2 className="font-heading text-[0.92rem] font-bold text-text-primary">Privacy Feed</h2>
            <p className="text-[0.74rem] text-text-muted mt-0.5">
              Controlla quali tue attività sono visibili agli altri utenti nel feed.
            </p>
          </div>
        </div>
        <div className="px-6">
          <PrivacySettings initial={privacy} />
        </div>
      </section>

      {/* Sezione Notifiche — placeholder */}
      <section className="bg-surface-1 border border-border-subtle rounded-lg overflow-hidden opacity-50">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-accent-amber/10 flex items-center justify-center shrink-0">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-accent-amber">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <div>
              <h2 className="font-heading text-[0.92rem] font-bold text-text-primary">Notifiche</h2>
              <p className="text-[0.74rem] text-text-muted mt-0.5">
                Gestisci email e notifiche in-app.
              </p>
            </div>
          </div>
          <span className="text-[0.65rem] font-heading font-bold uppercase tracking-wide text-text-muted bg-surface-2 px-2 py-1 rounded">
            Prossimamente
          </span>
        </div>
      </section>

      {/* Sezione Player video — placeholder */}
      <section className="bg-surface-1 border border-border-subtle rounded-lg overflow-hidden opacity-50">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-accent-violet/10 flex items-center justify-center shrink-0">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-accent-violet">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <div>
              <h2 className="font-heading text-[0.92rem] font-bold text-text-primary">Player Video</h2>
              <p className="text-[0.74rem] text-text-muted mt-0.5">
                Qualità predefinita, sottotitoli e velocità di riproduzione.
              </p>
            </div>
          </div>
          <span className="text-[0.65rem] font-heading font-bold uppercase tracking-wide text-text-muted bg-surface-2 px-2 py-1 rounded">
            Prossimamente
          </span>
        </div>
      </section>
    </div>
  );
}
