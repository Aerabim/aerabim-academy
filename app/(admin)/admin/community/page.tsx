import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { CommunityModerationTable } from '@/components/admin/community/CommunityModerationTable';

export default async function AdminCommunityPage() {
  const admin = getSupabaseAdmin();
  let discussions: {
    id: string; title: string; authorName: string; categoryName: string;
    replyCount: number; likeCount: number; isPinned: boolean; isLocked: boolean;
    isDeleted: boolean; createdAt: string;
  }[] = [];

  if (admin) {
    try {
      const { data } = await admin
        .from('community_discussions')
        .select('id, title, user_id, category_id, is_pinned, is_locked, is_deleted, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      const raw = (data ?? []) as {
        id: string; title: string; user_id: string; category_id: string;
        is_pinned: boolean; is_locked: boolean; is_deleted: boolean; created_at: string;
      }[];

      const userIds = Array.from(new Set(raw.map((d) => d.user_id)));
      const categoryIds = Array.from(new Set(raw.map((d) => d.category_id)));
      const discussionIds = raw.map((d) => d.id);

      const [profilesRes, categoriesRes, repliesRes, likesRes] = await Promise.all([
        admin.from('profiles').select('id, display_name').in('id', userIds.length > 0 ? userIds : ['']),
        admin.from('community_categories').select('id, name').in('id', categoryIds.length > 0 ? categoryIds : ['']),
        admin.from('community_replies').select('discussion_id').in('discussion_id', discussionIds.length > 0 ? discussionIds : ['']),
        admin.from('community_likes').select('discussion_id').in('discussion_id', discussionIds.length > 0 ? discussionIds : ['']).not('discussion_id', 'is', null),
      ]);

      const nameMap = new Map(((profilesRes.data ?? []) as { id: string; display_name: string | null }[]).map((p) => [p.id, p.display_name ?? 'Utente']));
      const catMap = new Map(((categoriesRes.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]));

      const replyCountMap = new Map<string, number>();
      for (const r of (repliesRes.data ?? []) as { discussion_id: string }[]) {
        replyCountMap.set(r.discussion_id, (replyCountMap.get(r.discussion_id) ?? 0) + 1);
      }
      const likeCountMap = new Map<string, number>();
      for (const l of (likesRes.data ?? []) as { discussion_id: string }[]) {
        likeCountMap.set(l.discussion_id, (likeCountMap.get(l.discussion_id) ?? 0) + 1);
      }

      discussions = raw.map((d) => ({
        id: d.id,
        title: d.title,
        authorName: nameMap.get(d.user_id) ?? 'Utente',
        categoryName: catMap.get(d.category_id) ?? 'Generale',
        replyCount: replyCountMap.get(d.id) ?? 0,
        likeCount: likeCountMap.get(d.id) ?? 0,
        isPinned: d.is_pinned,
        isLocked: d.is_locked,
        isDeleted: d.is_deleted,
        createdAt: d.created_at,
      }));
    } catch (err) {
      console.error('Community admin error:', err);
    }
  }

  return (
    <div className="p-6 lg:p-10 w-full">
      <div className="mb-6">
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">Moderazione Community</h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">Gestisci discussioni, pin, blocca o elimina contenuti.</p>
      </div>
      <CommunityModerationTable discussions={discussions} />
    </div>
  );
}
