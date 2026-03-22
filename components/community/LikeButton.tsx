'use client';

import { useState } from 'react';

interface LikeButtonProps {
  discussionId?: string;
  replyId?: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({ discussionId, replyId, initialLiked, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    if (isPending) return;

    // Optimistic update
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    setIsPending(true);

    try {
      const res = await fetch('/api/community/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discussionId, replyId }),
      });

      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setCount(data.count);
      } else {
        // Revert optimistic update
        setLiked(liked);
        setCount(count);
      }
    } catch {
      // Revert on error
      setLiked(liked);
      setCount(count);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1 text-[0.72rem] transition-colors ${
        liked
          ? 'text-accent-rose'
          : 'text-text-muted hover:text-accent-rose'
      }`}
    >
      <svg
        width="14"
        height="14"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
      {count > 0 && count}
    </button>
  );
}
