import { createServerClient } from '@/lib/supabase/server';
import type { LiveSessionDisplay } from '@/types';

type TypedClient = ReturnType<typeof createServerClient>;

// ── Row types (from Supabase query results) ─────────

interface LiveSessionRow {
  id: string;
  type: 'webinar' | 'mentoring';
  title: string;
  description: string | null;
  host_name: string;
  scheduled_at: string;
  duration_min: number;
  max_participants: number | null;
  status: 'scheduled' | 'live' | 'ended' | 'canceled';
  mux_playback_id: string | null;
  meeting_url: string | null;
  mux_replay_playback_id: string | null;
  is_published: boolean;
  created_at: string;
}

interface BookingRow {
  id: string;
  session_id: string;
  user_id: string;
  status: 'confirmed' | 'canceled';
}

interface SubscriptionRow {
  status: string;
  current_period_end: string | null;
}

// ── Subscription Check ──────────────────────────────

/**
 * Check if user has an active Pro subscription.
 * Returns true if subscription status is 'active' and period hasn't ended.
 */
export async function hasActiveProSubscription(
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

  const row = data as unknown as SubscriptionRow;
  if (!row.current_period_end) return true;
  return new Date(row.current_period_end) > new Date();
}

// ── Live Sessions Queries ───────────────────────────

/** Columns to select for public-facing session queries (excludes mux_stream_key) */
const PUBLIC_SESSION_COLUMNS =
  'id, type, title, description, host_name, scheduled_at, duration_min, max_participants, status, mux_playback_id, meeting_url, mux_replay_playback_id, is_published, created_at';

/**
 * Get all published live sessions with booking info for the current user.
 * Returns upcoming sessions (scheduled/live) and past sessions with replays.
 */
export async function getLiveSessions(
  supabase: TypedClient,
  userId: string,
): Promise<LiveSessionDisplay[]> {
  // Fetch published sessions
  const { data: rawSessions } = await supabase
    .from('live_sessions')
    .select(PUBLIC_SESSION_COLUMNS)
    .eq('is_published', true)
    .in('status', ['scheduled', 'live', 'ended'])
    .order('scheduled_at', { ascending: true });

  const sessions = (rawSessions ?? []) as unknown as LiveSessionRow[];
  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);

  // Fetch user's bookings for these sessions
  const { data: rawBookings } = await supabase
    .from('live_session_bookings')
    .select('id, session_id, user_id, status')
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .in('session_id', sessionIds);

  const bookings = (rawBookings ?? []) as unknown as BookingRow[];
  const bookedSessionIds = new Set(bookings.map((b) => b.session_id));

  // Fetch booking counts per session (using a separate query per session
  // would be N+1 — instead we count from all confirmed bookings)
  const { data: rawAllBookings } = await supabase
    .from('live_session_bookings')
    .select('session_id, status')
    .eq('status', 'confirmed')
    .in('session_id', sessionIds);

  const allBookings = (rawAllBookings ?? []) as unknown as BookingRow[];
  const countBySession = new Map<string, number>();
  for (const b of allBookings) {
    countBySession.set(b.session_id, (countBySession.get(b.session_id) ?? 0) + 1);
  }

  return sessions.map((s) => ({
    id: s.id,
    type: s.type,
    title: s.title,
    description: s.description,
    hostName: s.host_name,
    scheduledAt: s.scheduled_at,
    durationMin: s.duration_min,
    status: s.status,
    bookedCount: countBySession.get(s.id) ?? 0,
    maxParticipants: s.max_participants,
    isBooked: bookedSessionIds.has(s.id),
    hasReplay: s.mux_replay_playback_id !== null,
  }));
}

/**
 * Get a single session detail (public fields) with booking status.
 */
export async function getLiveSessionDetail(
  supabase: TypedClient,
  sessionId: string,
  userId: string,
): Promise<{
  session: LiveSessionRow;
  isBooked: boolean;
  bookedCount: number;
} | null> {
  const { data: rawSession } = await supabase
    .from('live_sessions')
    .select(PUBLIC_SESSION_COLUMNS)
    .eq('id', sessionId)
    .eq('is_published', true)
    .single();

  if (!rawSession) return null;
  const session = rawSession as unknown as LiveSessionRow;

  // User's booking
  const { data: rawBooking } = await supabase
    .from('live_session_bookings')
    .select('id, session_id, user_id, status')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .limit(1)
    .single();

  const isBooked = rawBooking !== null;

  // Total confirmed bookings count
  const { count } = await supabase
    .from('live_session_bookings')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('status', 'confirmed');

  return {
    session,
    isBooked,
    bookedCount: count ?? 0,
  };
}

/**
 * Get user's upcoming booked sessions (for dashboard widget).
 */
export async function getBookedSessions(
  supabase: TypedClient,
  userId: string,
  limit = 3,
): Promise<LiveSessionDisplay[]> {
  // Get user's confirmed bookings
  const { data: rawBookings } = await supabase
    .from('live_session_bookings')
    .select('session_id')
    .eq('user_id', userId)
    .eq('status', 'confirmed');

  const bookings = (rawBookings ?? []) as unknown as { session_id: string }[];
  if (bookings.length === 0) return [];

  const sessionIds = bookings.map((b) => b.session_id);

  const { data: rawSessions } = await supabase
    .from('live_sessions')
    .select(PUBLIC_SESSION_COLUMNS)
    .in('id', sessionIds)
    .eq('is_published', true)
    .in('status', ['scheduled', 'live'])
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  const sessions = (rawSessions ?? []) as unknown as LiveSessionRow[];

  return sessions.map((s) => ({
    id: s.id,
    type: s.type,
    title: s.title,
    description: s.description,
    hostName: s.host_name,
    scheduledAt: s.scheduled_at,
    durationMin: s.duration_min,
    status: s.status,
    bookedCount: 0,
    maxParticipants: s.max_participants,
    isBooked: true,
    hasReplay: false,
  }));
}

/**
 * Get upcoming published live sessions for the dashboard UpcomingEvents widget.
 */
export async function getUpcomingLiveSessions(
  supabase: TypedClient,
  limit = 3,
): Promise<LiveSessionDisplay[]> {
  const { data: rawSessions } = await supabase
    .from('live_sessions')
    .select(PUBLIC_SESSION_COLUMNS)
    .eq('is_published', true)
    .in('status', ['scheduled', 'live'])
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  const sessions = (rawSessions ?? []) as unknown as LiveSessionRow[];

  return sessions.map((s) => ({
    id: s.id,
    type: s.type,
    title: s.title,
    description: s.description,
    hostName: s.host_name,
    scheduledAt: s.scheduled_at,
    durationMin: s.duration_min,
    status: s.status,
    bookedCount: 0,
    maxParticipants: s.max_participants,
    isBooked: false,
    hasReplay: false,
  }));
}
