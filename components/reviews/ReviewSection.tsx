'use client';

import { useState, useCallback } from 'react';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { StarRatingDisplay } from '@/components/reviews/StarRating';
import type { CourseReviewDisplay, CourseReviewStats } from '@/types';

interface ReviewSectionProps {
  courseId: string;
  initialReviews: CourseReviewDisplay[];
  initialStats: CourseReviewStats;
  userReview: CourseReviewDisplay | null;
  isEnrolled: boolean;
  currentUserId: string | null;
}

export function ReviewSection({
  courseId,
  initialReviews,
  initialStats,
  userReview: initialUserReview,
  isEnrolled,
  currentUserId,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [stats, setStats] = useState(initialStats);
  const [userReview, setUserReview] = useState(initialUserReview);
  const [showForm, setShowForm] = useState(false);

  const refreshReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?courseId=${courseId}`);
      if (!res.ok) return;

      const data = await res.json();
      const fetched = (data.reviews ?? []) as Array<{
        id: string;
        user_id: string;
        course_id: string;
        rating: number;
        title: string | null;
        body: string | null;
        created_at: string;
      }>;

      // Recompute stats client-side
      const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let sum = 0;
      for (const r of fetched) {
        const key = r.rating as 1 | 2 | 3 | 4 | 5;
        distribution[key]++;
        sum += r.rating;
      }

      setStats({
        avgRating: fetched.length > 0 ? Math.round((sum / fetched.length) * 10) / 10 : 0,
        reviewCount: fetched.length,
        distribution,
      });

      // Map to display format (author info simplified for refresh)
      const mapped: CourseReviewDisplay[] = fetched.map((r) => {
        // Try to find existing author info from previous state
        const prev = reviews.find((p) => p.id === r.id);
        return {
          id: r.id,
          courseId: r.course_id,
          rating: r.rating,
          title: r.title,
          body: r.body,
          createdAt: r.created_at,
          author: prev?.author ?? { id: r.user_id, displayName: 'Studente', initials: 'ST' },
        };
      });

      setReviews(mapped);

      // Update user review
      const mine = mapped.find((r) => r.author.id === currentUserId) ?? null;
      setUserReview(mine);
      setShowForm(false);
    } catch {
      // Silently fail refresh
    }
  }, [courseId, currentUserId, reviews]);

  const handleDelete = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
      if (res.ok) {
        setUserReview(null);
        await refreshReviews();
      }
    } catch {
      // Silently fail
    }
  };

  const canReview = isEnrolled && currentUserId;
  const maxBar = Math.max(...Object.values(stats.distribution), 1);

  return (
    <section className="mt-10">
      <h2 className="font-heading text-lg font-bold text-text-primary mb-5">
        Recensioni del corso
      </h2>

      {/* Stats overview */}
      {stats.reviewCount > 0 && (
        <div className="flex items-start gap-6 mb-6 flex-wrap">
          {/* Average */}
          <div className="text-center">
            <p className="text-3xl font-bold text-text-primary">{stats.avgRating.toFixed(1)}</p>
            <StarRatingDisplay value={stats.avgRating} size="md" />
            <p className="text-text-muted text-[0.72rem] mt-1">
              {stats.reviewCount} {stats.reviewCount === 1 ? 'recensione' : 'recensioni'}
            </p>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 min-w-[200px] space-y-1">
            {([5, 4, 3, 2, 1] as const).map((star) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-text-muted text-[0.68rem] w-3 text-right">{star}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-accent-amber shrink-0">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-amber/70 rounded-full transition-all"
                    style={{ width: `${(stats.distribution[star] / maxBar) * 100}%` }}
                  />
                </div>
                <span className="text-text-muted text-[0.65rem] w-5 text-right">
                  {stats.distribution[star]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review form */}
      {canReview && !userReview && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-5 px-4 py-2 bg-accent-cyan/15 text-accent-cyan text-[0.78rem] font-semibold rounded-md hover:bg-accent-cyan/25 transition-colors"
        >
          Scrivi una recensione
        </button>
      )}

      {canReview && userReview && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-5 px-3 py-1.5 text-text-muted text-[0.72rem] hover:text-accent-cyan transition-colors"
        >
          Modifica la tua recensione
        </button>
      )}

      {showForm && canReview && (
        <div className="mb-5">
          <ReviewForm
            courseId={courseId}
            existingReview={userReview}
            onSubmitted={refreshReviews}
          />
        </div>
      )}

      {/* Review list */}
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isOwn={review.author.id === currentUserId}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-surface-1 border border-border-subtle rounded-md p-6 text-center">
          <p className="text-text-muted text-[0.82rem]">
            {isEnrolled
              ? 'Nessuna recensione ancora. Sii il primo a lasciare la tua!'
              : 'Nessuna recensione ancora per questo corso.'}
          </p>
        </div>
      )}
    </section>
  );
}
