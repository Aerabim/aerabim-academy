'use client';

import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

const SIZES = {
  sm: 14,
  md: 18,
  lg: 22,
};

export function StarRating({ value, onChange, size = 'md', readonly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const px = SIZES[size];
  const displayValue = hovered || value;

  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => !readonly && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-colors`}
          aria-label={`${star} ${star === 1 ? 'stella' : 'stelle'}`}
        >
          <svg
            width={px}
            height={px}
            viewBox="0 0 24 24"
            fill={star <= displayValue ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.5}
            className={
              star <= displayValue
                ? 'text-accent-amber'
                : 'text-text-muted/40'
            }
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

/** Display-only inline star rating with numeric value */
export function StarRatingDisplay({ value, count, size = 'sm' }: { value: number; count?: number; size?: 'sm' | 'md' }) {
  const px = SIZES[size];
  const rounded = Math.round(value * 2) / 2; // round to nearest 0.5

  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.floor(rounded);
        const half = !filled && star - 0.5 <= rounded;

        return (
          <svg
            key={star}
            width={px}
            height={px}
            viewBox="0 0 24 24"
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.5}
            className={filled || half ? 'text-accent-amber' : 'text-text-muted/30'}
          >
            {half ? (
              <>
                <defs>
                  <clipPath id={`half-${star}`}>
                    <rect x="0" y="0" width="12" height="24" />
                  </clipPath>
                </defs>
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  strokeWidth={1.5}
                />
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="currentColor"
                  clipPath={`url(#half-${star})`}
                />
              </>
            ) : (
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            )}
          </svg>
        );
      })}
      {count !== undefined && (
        <span className="text-text-muted text-[0.72rem] ml-0.5">({count})</span>
      )}
    </span>
  );
}
