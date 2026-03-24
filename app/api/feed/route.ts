import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { ApiError } from '@/types';

/** GET /api/feed — aggregated feed data for the Live section */
export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Devi effettuare il login.' } satisfies ApiError,
        { status: 401 },
      );
    }

    // Fetch in parallel: upcoming sessions, recent discussions, latest articles
    const now = new Date().toISOString();

    const [sessionsRes, discussionsRes, articlesRes] = await Promise.all([
      // Next 5 upcoming live sessions
      supabase
        .from('live_sessions')
        .select('id, type, title, host_name, scheduled_at, duration_min, status, max_participants')
        .eq('is_published', true)
        .gte('scheduled_at', now)
        .in('status', ['scheduled', 'live'])
        .order('scheduled_at', { ascending: true })
        .limit(5),

      // Latest 5 community discussions
      supabase
        .from('community_discussions')
        .select('id, title, category_id, reply_count, created_at, author_id')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(5),

      // Latest 5 published articles
      supabase
        .from('articles')
        .select('id, slug, title, excerpt, area, author_name, published_at, read_min')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(5),
    ]);

    // Get booking counts for sessions
    const sessionIds = ((sessionsRes.data ?? []) as { id: string }[]).map((s) => s.id);
    const { data: bookingsRaw } = await supabase
      .from('live_session_bookings')
      .select('session_id, user_id')
      .in('session_id', sessionIds.length > 0 ? sessionIds : [''])
      .eq('status', 'confirmed');

    const bookingCounts = new Map<string, number>();
    const userBookings = new Set<string>();
    for (const b of (bookingsRaw ?? []) as { session_id: string; user_id: string }[]) {
      bookingCounts.set(b.session_id, (bookingCounts.get(b.session_id) ?? 0) + 1);
      if (b.user_id === user.id) userBookings.add(b.session_id);
    }

    // Get author names for discussions
    const authorIds = Array.from(new Set(
      ((discussionsRes.data ?? []) as { author_id: string }[]).map((d) => d.author_id),
    ));
    const { data: profilesRaw } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', authorIds.length > 0 ? authorIds : ['']);

    const profileMap = new Map(
      ((profilesRaw ?? []) as { id: string; display_name: string | null }[])
        .map((p) => [p.id, p.display_name ?? 'Utente']),
    );

    // Get category names
    const categoryIds = Array.from(new Set(
      ((discussionsRes.data ?? []) as { category_id: string }[]).map((d) => d.category_id),
    ));
    const { data: categoriesRaw } = await supabase
      .from('community_categories')
      .select('id, name, emoji')
      .in('id', categoryIds.length > 0 ? categoryIds : ['']);

    const categoryMap = new Map(
      ((categoriesRaw ?? []) as { id: string; name: string; emoji: string | null }[])
        .map((c) => [c.id, { name: c.name, emoji: c.emoji }]),
    );

    // Build response
    const sessions = ((sessionsRes.data ?? []) as {
      id: string; type: string; title: string; host_name: string;
      scheduled_at: string; duration_min: number; status: string; max_participants: number | null;
    }[]).map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      hostName: s.host_name,
      scheduledAt: s.scheduled_at,
      durationMin: s.duration_min,
      status: s.status,
      bookedCount: bookingCounts.get(s.id) ?? 0,
      maxParticipants: s.max_participants,
      isBooked: userBookings.has(s.id),
    }));

    const discussions = ((discussionsRes.data ?? []) as {
      id: string; title: string; category_id: string;
      reply_count: number; created_at: string; author_id: string;
    }[]).map((d) => ({
      id: d.id,
      title: d.title,
      categoryName: categoryMap.get(d.category_id)?.name ?? '',
      categoryEmoji: categoryMap.get(d.category_id)?.emoji ?? null,
      replyCount: d.reply_count,
      authorName: profileMap.get(d.author_id) ?? 'Utente',
      createdAt: d.created_at,
    }));

    const articles = ((articlesRes.data ?? []) as {
      id: string; slug: string; title: string; excerpt: string | null;
      area: string | null; author_name: string; published_at: string; read_min: number;
    }[]).map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      area: a.area,
      authorName: a.author_name,
      publishedAt: a.published_at,
      readMin: a.read_min,
    }));

    return NextResponse.json({ sessions, discussions, articles });
  } catch (err) {
    console.error('GET /api/feed error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
