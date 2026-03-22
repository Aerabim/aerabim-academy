import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getInitials } from '@/lib/utils';
import type {
  CommunityCategoryDisplay,
  CommunityDiscussionDisplay,
  CommunityReplyDisplay,
  CommunityAuthor,
} from '@/types';

type TypedClient = ReturnType<typeof createServerClient>;

// ── Row types (from Supabase query results) ─────────

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  order_num: number;
  emoji: string | null;
}

interface DiscussionRow {
  id: string;
  author_id: string;
  category_id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  is_locked: boolean;
  reply_count: number;
  last_reply_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ReplyRow {
  id: string;
  discussion_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  role: string;
}

interface SubscriptionRow {
  user_id: string;
  plan: string;
  status: string;
}

interface LikeCountRow {
  discussion_id: string | null;
  reply_id: string | null;
}

// ── Subscription Check ─────────────────────────────

/**
 * Check if user has an active Pro/Team/PA subscription.
 */
export async function hasActiveCommunityAccess(
  supabase: TypedClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .single();

  if (!data) return false;

  const row = data as unknown as { status: string; current_period_end: string | null };
  if (!row.current_period_end) return true;
  return new Date(row.current_period_end) > new Date();
}

// ── Author Resolution ───────────────────────────────

/**
 * Batch-resolve author info for a set of user IDs.
 * Uses admin client to read profiles + subscriptions + certificate counts.
 */
async function resolveAuthors(
  userIds: string[],
): Promise<Map<string, CommunityAuthor>> {
  const map = new Map<string, CommunityAuthor>();
  if (userIds.length === 0) return map;

  const uniqueIds = Array.from(new Set(userIds));
  const admin = getSupabaseAdmin();
  if (!admin) return map;

  // Fetch profiles
  const { data: rawProfiles } = await admin
    .from('profiles')
    .select('id, display_name, role')
    .in('id', uniqueIds);

  const profiles = (rawProfiles ?? []) as unknown as ProfileRow[];
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  // Fetch active subscriptions
  const { data: rawSubs } = await admin
    .from('subscriptions')
    .select('user_id, plan, status')
    .in('user_id', uniqueIds)
    .eq('status', 'active');

  const subs = (rawSubs ?? []) as unknown as SubscriptionRow[];
  const subMap = new Map(subs.map((s) => [s.user_id, s.plan]));

  // Fetch certificate counts
  const { data: rawCerts } = await admin
    .from('certificates')
    .select('user_id')
    .in('user_id', uniqueIds);

  const certCounts = new Map<string, number>();
  for (const row of (rawCerts ?? []) as unknown as { user_id: string }[]) {
    certCounts.set(row.user_id, (certCounts.get(row.user_id) ?? 0) + 1);
  }

  // Also fetch display names from auth.users metadata for users without display_name in profiles
  const { data: authUsers } = await admin.auth.admin.listUsers();
  const authMap = new Map<string, string>();
  if (authUsers?.users) {
    for (const u of authUsers.users) {
      if (uniqueIds.includes(u.id)) {
        const name = (u.user_metadata?.full_name as string) || u.email || 'Utente';
        authMap.set(u.id, name);
      }
    }
  }

  for (const uid of uniqueIds) {
    const profile = profileMap.get(uid);
    const displayName = profile?.display_name || authMap.get(uid) || 'Utente';
    const plan = subMap.get(uid) as 'pro' | 'team' | 'pa' | undefined;

    map.set(uid, {
      id: uid,
      displayName,
      initials: getInitials(displayName),
      plan: plan ?? 'free',
      certificateCount: certCounts.get(uid) ?? 0,
    });
  }

  return map;
}

// ── Categories ──────────────────────────────────────

/**
 * Get all categories with discussion counts and latest discussion info.
 */
export async function getCategories(
  supabase: TypedClient,
): Promise<CommunityCategoryDisplay[]> {
  const { data: rawCategories } = await supabase
    .from('community_categories')
    .select('id, slug, name, description, order_num, emoji')
    .order('order_num', { ascending: true });

  const categories = (rawCategories ?? []) as unknown as CategoryRow[];
  if (categories.length === 0) return [];

  const categoryIds = categories.map((c) => c.id);

  // Discussion counts per category
  const countMap = new Map<string, number>();
  for (const catId of categoryIds) {
    const { count } = await supabase
      .from('community_discussions')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', catId)
      .eq('is_deleted', false);

    countMap.set(catId, count ?? 0);
  }

  // Latest discussion per category
  const latestMap = new Map<string, { title: string; created_at: string }>();
  for (const catId of categoryIds) {
    const { data: rawLatest } = await supabase
      .from('community_discussions')
      .select('title, created_at')
      .eq('category_id', catId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (rawLatest) {
      latestMap.set(catId, rawLatest as unknown as { title: string; created_at: string });
    }
  }

  return categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    orderNum: c.order_num,
    emoji: c.emoji,
    discussionCount: countMap.get(c.id) ?? 0,
    latestDiscussionTitle: latestMap.get(c.id)?.title ?? null,
    latestDiscussionAt: latestMap.get(c.id)?.created_at ?? null,
  }));
}

/**
 * Resolve a category slug to its ID. Returns null if not found.
 */
export async function getCategoryBySlug(
  supabase: TypedClient,
  slug: string,
): Promise<CategoryRow | null> {
  const { data } = await supabase
    .from('community_categories')
    .select('id, slug, name, description, order_num, emoji')
    .eq('slug', slug)
    .single();

  return (data as unknown as CategoryRow) ?? null;
}

// ── Discussions ─────────────────────────────────────

interface GetDiscussionsOptions {
  categoryId?: string;
  sort?: 'recent' | 'popular';
  limit?: number;
  offset?: number;
}

/**
 * Get paginated discussions with author info and like counts.
 */
export async function getDiscussions(
  supabase: TypedClient,
  userId: string,
  options: GetDiscussionsOptions = {},
): Promise<{ discussions: CommunityDiscussionDisplay[]; total: number }> {
  const { categoryId, sort = 'recent', limit = 15, offset = 0 } = options;

  // Build query
  let query = supabase
    .from('community_discussions')
    .select('id, author_id, category_id, title, body, is_pinned, is_locked, reply_count, last_reply_at, created_at, updated_at')
    .eq('is_deleted', false);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  // Pinned always first, then sort
  if (sort === 'popular') {
    query = query
      .order('is_pinned', { ascending: false })
      .order('reply_count', { ascending: false });
  } else {
    query = query
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data: rawDiscussions } = await query;
  const discussions = (rawDiscussions ?? []) as unknown as DiscussionRow[];

  // Total count
  let countQuery = supabase
    .from('community_discussions')
    .select('id', { count: 'exact', head: true })
    .eq('is_deleted', false);

  if (categoryId) {
    countQuery = countQuery.eq('category_id', categoryId);
  }

  const { count: total } = await countQuery;

  if (discussions.length === 0) {
    return { discussions: [], total: total ?? 0 };
  }

  // Resolve categories
  const categoryIds = Array.from(new Set(discussions.map((d) => d.category_id)));
  const { data: rawCats } = await supabase
    .from('community_categories')
    .select('id, slug, name')
    .in('id', categoryIds);

  const cats = (rawCats ?? []) as unknown as { id: string; slug: string; name: string }[];
  const catMap = new Map(cats.map((c) => [c.id, c]));

  // Resolve authors
  const authorIds = discussions.map((d) => d.author_id);
  const authorMap = await resolveAuthors(authorIds);

  // Like counts per discussion
  const discussionIds = discussions.map((d) => d.id);
  const { data: rawLikes } = await supabase
    .from('community_likes')
    .select('discussion_id, reply_id')
    .in('discussion_id', discussionIds);

  const likes = (rawLikes ?? []) as unknown as LikeCountRow[];
  const likeCountMap = new Map<string, number>();
  for (const l of likes) {
    if (l.discussion_id) {
      likeCountMap.set(l.discussion_id, (likeCountMap.get(l.discussion_id) ?? 0) + 1);
    }
  }

  // User's own likes
  const { data: rawUserLikes } = await supabase
    .from('community_likes')
    .select('discussion_id')
    .eq('user_id', userId)
    .in('discussion_id', discussionIds);

  const userLikedIds = new Set(
    ((rawUserLikes ?? []) as unknown as { discussion_id: string }[]).map((l) => l.discussion_id),
  );

  return {
    discussions: discussions.map((d) => {
      const cat = catMap.get(d.category_id);
      return {
        id: d.id,
        categoryId: d.category_id,
        categorySlug: cat?.slug ?? '',
        categoryName: cat?.name ?? '',
        title: d.title,
        body: d.body,
        isPinned: d.is_pinned,
        isLocked: d.is_locked,
        replyCount: d.reply_count,
        likeCount: likeCountMap.get(d.id) ?? 0,
        isLikedByUser: userLikedIds.has(d.id),
        lastReplyAt: d.last_reply_at,
        createdAt: d.created_at,
        author: authorMap.get(d.author_id) ?? {
          id: d.author_id,
          displayName: 'Utente',
          initials: '?',
          plan: 'free' as const,
          certificateCount: 0,
        },
      };
    }),
    total: total ?? 0,
  };
}

// ── Discussion Detail ───────────────────────────────

interface DiscussionDetail {
  discussion: CommunityDiscussionDisplay;
  replies: CommunityReplyDisplay[];
  totalReplies: number;
}

/**
 * Get a single discussion with its replies.
 */
export async function getDiscussionDetail(
  supabase: TypedClient,
  userId: string,
  discussionId: string,
  replyLimit = 20,
  replyOffset = 0,
): Promise<DiscussionDetail | null> {
  // Fetch discussion
  const { data: rawDiscussion } = await supabase
    .from('community_discussions')
    .select('id, author_id, category_id, title, body, is_pinned, is_locked, reply_count, last_reply_at, created_at, updated_at')
    .eq('id', discussionId)
    .eq('is_deleted', false)
    .single();

  if (!rawDiscussion) return null;

  const d = rawDiscussion as unknown as DiscussionRow;

  // Fetch category
  const { data: rawCat } = await supabase
    .from('community_categories')
    .select('id, slug, name')
    .eq('id', d.category_id)
    .single();

  const cat = rawCat as unknown as { id: string; slug: string; name: string } | null;

  // Fetch replies
  const { data: rawReplies } = await supabase
    .from('community_replies')
    .select('id, discussion_id, author_id, body, created_at, updated_at')
    .eq('discussion_id', discussionId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .range(replyOffset, replyOffset + replyLimit - 1);

  const replies = (rawReplies ?? []) as unknown as ReplyRow[];

  // Total reply count
  const { count: totalReplies } = await supabase
    .from('community_replies')
    .select('id', { count: 'exact', head: true })
    .eq('discussion_id', discussionId)
    .eq('is_deleted', false);

  // Resolve all authors (discussion + replies)
  const allAuthorIds = [d.author_id, ...replies.map((r) => r.author_id)];
  const authorMap = await resolveAuthors(allAuthorIds);

  // Like count for discussion
  const { count: discussionLikeCount } = await supabase
    .from('community_likes')
    .select('id', { count: 'exact', head: true })
    .eq('discussion_id', discussionId);

  // User's like on discussion
  const { data: rawUserLike } = await supabase
    .from('community_likes')
    .select('id')
    .eq('user_id', userId)
    .eq('discussion_id', discussionId)
    .limit(1)
    .single();

  // Like counts for replies
  const replyIds = replies.map((r) => r.id);
  const replyLikeCountMap = new Map<string, number>();
  const userLikedReplyIds = new Set<string>();

  if (replyIds.length > 0) {
    const { data: rawReplyLikes } = await supabase
      .from('community_likes')
      .select('reply_id')
      .in('reply_id', replyIds);

    for (const l of (rawReplyLikes ?? []) as unknown as { reply_id: string }[]) {
      replyLikeCountMap.set(l.reply_id, (replyLikeCountMap.get(l.reply_id) ?? 0) + 1);
    }

    const { data: rawUserReplyLikes } = await supabase
      .from('community_likes')
      .select('reply_id')
      .eq('user_id', userId)
      .in('reply_id', replyIds);

    for (const l of (rawUserReplyLikes ?? []) as unknown as { reply_id: string }[]) {
      userLikedReplyIds.add(l.reply_id);
    }
  }

  const defaultAuthor: CommunityAuthor = {
    id: '',
    displayName: 'Utente',
    initials: '?',
    plan: 'free',
    certificateCount: 0,
  };

  return {
    discussion: {
      id: d.id,
      categoryId: d.category_id,
      categorySlug: cat?.slug ?? '',
      categoryName: cat?.name ?? '',
      title: d.title,
      body: d.body,
      isPinned: d.is_pinned,
      isLocked: d.is_locked,
      replyCount: d.reply_count,
      likeCount: discussionLikeCount ?? 0,
      isLikedByUser: rawUserLike !== null,
      lastReplyAt: d.last_reply_at,
      createdAt: d.created_at,
      author: authorMap.get(d.author_id) ?? { ...defaultAuthor, id: d.author_id },
    },
    replies: replies.map((r) => ({
      id: r.id,
      discussionId: r.discussion_id,
      body: r.body,
      likeCount: replyLikeCountMap.get(r.id) ?? 0,
      isLikedByUser: userLikedReplyIds.has(r.id),
      createdAt: r.created_at,
      author: authorMap.get(r.author_id) ?? { ...defaultAuthor, id: r.author_id },
    })),
    totalReplies: totalReplies ?? 0,
  };
}
