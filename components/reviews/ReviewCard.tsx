import { StarRatingDisplay } from '@/components/reviews/StarRating';
import { timeAgo } from '@/lib/utils';
import type { CourseReviewDisplay } from '@/types';

interface ReviewCardProps {
  review: CourseReviewDisplay;
  isOwn: boolean;
  onDelete?: (reviewId: string) => void;
}

export function ReviewCard({ review, isOwn, onDelete }: ReviewCardProps) {
  return (
    <div className="border border-border-subtle rounded-md p-4 bg-surface-1">
      {/* Header: author + rating */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-brand-blue/30 flex items-center justify-center text-[0.65rem] font-bold text-text-secondary">
            {review.author.initials}
          </div>
          <div>
            <p className="text-text-primary text-[0.82rem] font-semibold leading-tight">
              {review.author.displayName}
            </p>
            <p className="text-text-muted text-[0.68rem]">{timeAgo(review.createdAt)}</p>
          </div>
        </div>
        <StarRatingDisplay value={review.rating} size="sm" />
      </div>

      {/* Title */}
      {review.title && (
        <p className="text-text-primary text-[0.8rem] font-semibold mb-1">{review.title}</p>
      )}

      {/* Body */}
      {review.body && (
        <p className="text-text-secondary text-[0.78rem] leading-relaxed">{review.body}</p>
      )}

      {/* Delete for own review */}
      {isOwn && onDelete && (
        <button
          onClick={() => onDelete(review.id)}
          className="mt-2 text-text-muted text-[0.68rem] hover:text-accent-rose transition-colors"
        >
          Elimina la tua recensione
        </button>
      )}
    </div>
  );
}
