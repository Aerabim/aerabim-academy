export const dynamic = 'force-dynamic';

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { FeedConfigToggles } from '@/components/admin/feed/FeedConfigToggles';
import { FeedPostsManager } from '@/components/admin/feed/FeedPostsManager';
import { FeedModerationTable } from '@/components/admin/feed/FeedModerationTable';
import type { FeedConfig, AdminFeedPost, AdminFeedEvent, FeedItemType } from '@/types';

const DEFAULT_CONFIG: FeedConfig = {
  progressEnabled: true,
  certificatesEnabled: true,
  enrollmentsEnabled: true,
  discussionsEnabled: true,
};

export default async function AdminFeedPage() {
  const admin = getSupabaseAdmin();

  let config: FeedConfig = DEFAULT_CONFIG;
  let posts: AdminFeedPost[] = [];
  let events: AdminFeedEvent[] = [];

  if (admin) {
    const [configRes, postsRes] = await Promise.all([
      admin.from('feed_config').select('*').eq('id', 1).maybeSingle(),
      admin.from('feed_posts')
        .select('id, title, body, href, is_pinned, is_published, created_at, media_type, media_url')
        .order('created_at', { ascending: false }),
    ]);

    if (configRes.data) {
      const r = configRes.data as {
        progress_enabled: boolean;
        certificates_enabled: boolean;
        enrollments_enabled: boolean;
        discussions_enabled: boolean;
      };
      config = {
        progressEnabled: r.progress_enabled,
        certificatesEnabled: r.certificates_enabled,
        enrollmentsEnabled: r.enrollments_enabled,
        discussionsEnabled: r.discussions_enabled,
      };
    }

    posts = ((postsRes.data ?? []) as {
      id: string; title: string; body: string; href: string | null;
      is_pinned: boolean; is_published: boolean; created_at: string;
      media_type: string | null; media_url: string | null;
    }[]).map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      href: p.href,
      isPinned: p.is_pinned,
      isPublished: p.is_published,
      createdAt: p.created_at,
      mediaType: p.media_type as 'image' | 'video' | null,
      mediaUrl: p.media_url,
    }));

    // Build moderation events from recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [progressRes, certsRes, enrollRes, discussRes, hiddenRes] = await Promise.all([
      admin.from('progress')
        .select('id, user_id, lesson_id, completed_at')
        .eq('completed', true)
        .gte('completed_at', sevenDaysAgo)
        .order('completed_at', { ascending: false })
        .limit(30),
      admin.from('certificates')
        .select('id, user_id, course_id, issued_at')
        .gte('issued_at', sevenDaysAgo)
        .order('issued_at', { ascending: false })
        .limit(30),
      admin.from('enrollments')
        .select('id, user_id, course_id, created_at')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(30),
      admin.from('community_discussions')
        .select('id, title, author_id, created_at')
        .eq('is_deleted', false)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(30),
      admin.from('feed_hidden_items').select('item_type, item_id'),
    ]);

    const hiddenSet = new Set(
      ((hiddenRes.data ?? []) as { item_type: string; item_id: string }[])
        .map((h) => `${h.item_type}:${h.item_id}`),
    );

    // Collect user and entity IDs for label resolution
    type ProgressRow = { id: string; user_id: string; lesson_id: string; completed_at: string };
    type CertRow = { id: string; user_id: string; course_id: string; issued_at: string };
    type EnrollRow = { id: string; user_id: string; course_id: string; created_at: string };
    type DiscRow = { id: string; title: string; author_id: string; created_at: string };

    const progresses = (progressRes.data ?? []) as ProgressRow[];
    const certs = (certsRes.data ?? []) as CertRow[];
    const enrollments = (enrollRes.data ?? []) as EnrollRow[];
    const discussions = (discussRes.data ?? []) as DiscRow[];

    const userIds = Array.from(new Set([
      ...progresses.map((p) => p.user_id),
      ...certs.map((c) => c.user_id),
      ...enrollments.map((e) => e.user_id),
      ...discussions.map((d) => d.author_id),
    ]));

    const lessonIds = progresses.map((p) => p.lesson_id);
    const courseIds = Array.from(new Set([
      ...certs.map((c) => c.course_id),
      ...enrollments.map((e) => e.course_id),
    ]));

    const [profilesRes, lessonsRes, coursesRes] = await Promise.all([
      userIds.length > 0
        ? admin.from('profiles').select('id, display_name').in('id', userIds)
        : { data: [] },
      lessonIds.length > 0
        ? admin.from('lessons').select('id, title').in('id', lessonIds)
        : { data: [] },
      courseIds.length > 0
        ? admin.from('courses').select('id, title').in('id', courseIds)
        : { data: [] },
    ]);

    const profileMap = new Map(
      ((profilesRes.data ?? []) as { id: string; display_name: string | null }[])
        .map((p) => [p.id, p.display_name ?? 'Utente']),
    );
    const lessonMap = new Map(
      ((lessonsRes.data ?? []) as { id: string; title: string }[])
        .map((l) => [l.id, l.title]),
    );
    const courseMap = new Map(
      ((coursesRes.data ?? []) as { id: string; title: string }[])
        .map((c) => [c.id, c.title]),
    );

    const rawEvents: AdminFeedEvent[] = [];

    for (const p of progresses) {
      rawEvents.push({
        id: `progress:${p.id}`,
        type: 'progress' as FeedItemType,
        itemId: p.id,
        label: `${profileMap.get(p.user_id) ?? 'Utente'} ha completato "${lessonMap.get(p.lesson_id) ?? 'lezione'}"`,
        createdAt: p.completed_at,
        isHidden: hiddenSet.has(`progress:${p.id}`),
      });
    }
    for (const c of certs) {
      rawEvents.push({
        id: `certificate:${c.id}`,
        type: 'certificate' as FeedItemType,
        itemId: c.id,
        label: `${profileMap.get(c.user_id) ?? 'Utente'} ha conseguito il certificato "${courseMap.get(c.course_id) ?? 'corso'}"`,
        createdAt: c.issued_at,
        isHidden: hiddenSet.has(`certificate:${c.id}`),
      });
    }
    for (const e of enrollments) {
      rawEvents.push({
        id: `enrollment:${e.id}`,
        type: 'enrollment' as FeedItemType,
        itemId: e.id,
        label: `${profileMap.get(e.user_id) ?? 'Utente'} si è iscritto a "${courseMap.get(e.course_id) ?? 'corso'}"`,
        createdAt: e.created_at,
        isHidden: hiddenSet.has(`enrollment:${e.id}`),
      });
    }
    for (const d of discussions) {
      rawEvents.push({
        id: `discussion:${d.id}`,
        type: 'discussion' as FeedItemType,
        itemId: d.id,
        label: `${profileMap.get(d.author_id) ?? 'Utente'} ha aperto "${d.title}"`,
        createdAt: d.created_at,
        isHidden: hiddenSet.has(`discussion:${d.id}`),
      });
    }

    events = rawEvents.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  return (
    <div className="w-full px-6 lg:px-9 py-7 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Gestione Feed</h1>
        <p className="mt-1.5 text-text-secondary text-[0.84rem]">
          Controlla le sorgenti attive, crea comunicati editoriali e modera i contenuti.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Sorgenti globali */}
        <section className="bg-surface-1 border border-border-subtle rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-accent-cyan/10 flex items-center justify-center shrink-0">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-accent-cyan">
                <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
                <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" />
                <circle cx="12" cy="12" r="2" />
                <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" />
                <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
              </svg>
            </div>
            <div>
              <h2 className="font-heading text-[0.92rem] font-bold text-text-primary">Sorgenti attive</h2>
              <p className="text-[0.74rem] text-text-muted mt-0.5">
                Disattiva una sorgente per nasconderla a tutti gli utenti.
              </p>
            </div>
          </div>
          <div className="px-6">
            <FeedConfigToggles initial={config} />
          </div>
        </section>

        {/* Post editoriali */}
        <section className="bg-surface-1 border border-border-subtle rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-accent-amber/10 flex items-center justify-center shrink-0">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-accent-amber">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div>
              <h2 className="font-heading text-[0.92rem] font-bold text-text-primary">Post editoriali</h2>
              <p className="text-[0.74rem] text-text-muted mt-0.5">
                Comunicati ufficiali AERABIM visibili a tutti nel feed.
              </p>
            </div>
          </div>
          <div className="px-6 py-4">
            <FeedPostsManager initial={posts} />
          </div>
        </section>
      </div>

      {/* Moderazione attività recente */}
      <section className="bg-surface-1 border border-border-subtle rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-accent-rose/10 flex items-center justify-center shrink-0">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-accent-rose">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
          </div>
          <div>
            <h2 className="font-heading text-[0.92rem] font-bold text-text-primary">Attività recente</h2>
            <p className="text-[0.74rem] text-text-muted mt-0.5">
              Ultimi 7 giorni · Nascondi singoli item dal feed senza disattivare la sorgente.
            </p>
          </div>
        </div>
        <div className="px-6 py-2">
          <FeedModerationTable initial={events} />
        </div>
      </section>
    </div>
  );
}
