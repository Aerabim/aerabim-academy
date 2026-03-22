import { createServerClient } from '@/lib/supabase/server';
import { getInitials } from '@/lib/utils';
import type { CourseReviewDisplay, CourseReviewStats, ReviewAuthor } from '@/types';

type TypedClient = ReturnType<typeof createServerClient>;

// ── Row types (Supabase generic inference workaround) ──

interface ReviewRow {
  id: string;
  user_id: string;
  course_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
}

// ── Resolve authors for a set of user IDs ──────────────

async function resolveReviewAuthors(
  supabase: TypedClient,
  userIds: string[],
): Promise<Map<string, ReviewAuthor>> {
  const map = new Map<string, ReviewAuthor>();
  if (userIds.length === 0) return map;

  const unique = Array.from(new Set(userIds));

  // Fetch profiles
  const { data: rawProfiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', unique);
  const profiles = (rawProfiles ?? []) as unknown as ProfileRow[];
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  // Fetch auth metadata for full_name fallback
  for (const uid of unique) {
    const profile = profileMap.get(uid);
    let displayName = profile?.display_name || '';

    if (!displayName) {
      // Fallback: try auth user metadata
      try {
        const { data: rawUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', uid)
          .single();
        if (rawUser) {
          displayName = 'Studente';
        }
      } catch {
        displayName = 'Studente';
      }
    }

    if (!displayName) displayName = 'Studente';

    map.set(uid, {
      id: uid,
      displayName,
      initials: getInitials(displayName),
    });
  }

  return map;
}

// ── Get reviews for a course ────────────────────────────

export async function getCourseReviews(
  supabase: TypedClient,
  courseId: string,
): Promise<CourseReviewDisplay[]> {
  const { data: rawReviews, error } = await supabase
    .from('course_reviews')
    .select('id, user_id, course_id, rating, title, body, created_at')
    .eq('course_id', courseId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error || !rawReviews) return [];

  const reviews = rawReviews as unknown as ReviewRow[];
  const userIds = reviews.map((r) => r.user_id);
  const authors = await resolveReviewAuthors(supabase, userIds);

  return reviews.map((r) => ({
    id: r.id,
    courseId: r.course_id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.created_at,
    author: authors.get(r.user_id) ?? {
      id: r.user_id,
      displayName: 'Studente',
      initials: 'ST',
    },
  }));
}

// ── Get review stats for a course ───────────────────────

export async function getCourseReviewStats(
  supabase: TypedClient,
  courseId: string,
): Promise<CourseReviewStats> {
  const { data: rawReviews } = await supabase
    .from('course_reviews')
    .select('rating')
    .eq('course_id', courseId)
    .eq('is_deleted', false);

  const reviews = (rawReviews ?? []) as unknown as { rating: number }[];

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  for (const r of reviews) {
    const key = r.rating as 1 | 2 | 3 | 4 | 5;
    distribution[key] = (distribution[key] ?? 0) + 1;
    sum += r.rating;
  }

  return {
    avgRating: reviews.length > 0 ? Math.round((sum / reviews.length) * 10) / 10 : 0,
    reviewCount: reviews.length,
    distribution,
  };
}

// ── Check if user already reviewed a course ─────────────

export async function getUserReview(
  supabase: TypedClient,
  userId: string,
  courseId: string,
): Promise<CourseReviewDisplay | null> {
  const { data: rawReview } = await supabase
    .from('course_reviews')
    .select('id, user_id, course_id, rating, title, body, created_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('is_deleted', false)
    .maybeSingle();

  if (!rawReview) return null;

  const review = rawReview as unknown as ReviewRow;
  const authors = await resolveReviewAuthors(supabase, [review.user_id]);

  return {
    id: review.id,
    courseId: review.course_id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.created_at,
    author: authors.get(review.user_id) ?? {
      id: review.user_id,
      displayName: 'Studente',
      initials: 'ST',
    },
  };
}

// ── Check active enrollment ─────────────────────────────

export async function hasActiveEnrollment(
  supabase: TypedClient,
  userId: string,
  courseId: string,
): Promise<boolean> {
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, expires_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (!enrollment) return false;

  const row = enrollment as unknown as { id: string; expires_at: string | null };
  return !row.expires_at || new Date(row.expires_at) > new Date();
}
