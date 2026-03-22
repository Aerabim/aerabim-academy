'use client';

import { useState } from 'react';
import { StarRating } from '@/components/reviews/StarRating';
import type { CourseReviewDisplay } from '@/types';

interface ReviewFormProps {
  courseId: string;
  existingReview?: CourseReviewDisplay | null;
  onSubmitted: () => void;
}

export function ReviewForm({ courseId, existingReview, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [title, setTitle] = useState(existingReview?.title ?? '');
  const [body, setBody] = useState(existingReview?.body ?? '');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Seleziona una valutazione.');
      return;
    }

    setIsPending(true);
    setError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, rating, title: title.trim() || undefined, body: body.trim() || undefined }),
      });

      if (res.ok) {
        onSubmitted();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Errore durante il salvataggio.');
      }
    } catch {
      setError('Errore di connessione. Riprova.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border-subtle rounded-md p-4 bg-surface-1">
      <p className="text-text-primary text-[0.85rem] font-semibold mb-3">
        {existingReview ? 'Modifica la tua recensione' : 'Lascia una recensione'}
      </p>

      {/* Star selector */}
      <div className="mb-3">
        <label className="text-text-muted text-[0.72rem] block mb-1.5">Valutazione *</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      {/* Title */}
      <div className="mb-3">
        <label className="text-text-muted text-[0.72rem] block mb-1">Titolo (opzionale)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Riassumi la tua esperienza..."
          className="w-full bg-surface-0 border border-border-subtle rounded-md px-3 py-2 text-text-primary text-[0.8rem] placeholder:text-text-muted/50 focus:outline-none focus:border-accent-cyan/40 transition-colors"
        />
      </div>

      {/* Body */}
      <div className="mb-3">
        <label className="text-text-muted text-[0.72rem] block mb-1">Commento (opzionale)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Cosa ti è piaciuto? Cosa potrebbe migliorare?"
          className="w-full bg-surface-0 border border-border-subtle rounded-md px-3 py-2 text-text-primary text-[0.8rem] placeholder:text-text-muted/50 focus:outline-none focus:border-accent-cyan/40 transition-colors resize-none"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-accent-rose text-[0.72rem] mb-2">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || rating === 0}
        className="px-4 py-2 bg-accent-cyan/15 text-accent-cyan text-[0.78rem] font-semibold rounded-md hover:bg-accent-cyan/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Invio...' : existingReview ? 'Aggiorna recensione' : 'Pubblica recensione'}
      </button>
    </form>
  );
}
