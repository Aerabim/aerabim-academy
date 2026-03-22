'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReplyFormProps {
  discussionId: string;
}

export function ReplyForm({ discussionId }: ReplyFormProps) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/community/discussions/${discussionId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore durante l\'invio.');
        return;
      }

      setBody('');
      router.refresh();
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-1 border border-border-subtle rounded-lg p-5">
      <label htmlFor="reply-body" className="block text-[0.78rem] font-medium text-text-secondary mb-2">
        La tua risposta
      </label>
      <textarea
        id="reply-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Scrivi la tua risposta..."
        rows={4}
        required
        className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2.5 text-[0.82rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan transition-colors resize-y mb-3"
      />

      {error && (
        <div className="text-[0.78rem] text-accent-rose bg-accent-rose/10 px-3 py-2 rounded-lg mb-3">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !body.trim()}
          className="px-4 py-2 bg-accent-cyan text-brand-dark font-semibold text-[0.78rem] rounded-lg hover:bg-accent-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Invio...' : 'Rispondi'}
        </button>
      </div>
    </form>
  );
}
