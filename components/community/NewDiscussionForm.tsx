'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CommunityCategory } from '@/types';

const FALLBACK_CATEGORIES: CommunityCategory[] = [
  { id: 'generale', slug: 'generale', name: 'Generale', description: null, order_num: 0, emoji: '💬' },
  { id: 'SW', slug: 'software', name: 'Software BIM', description: null, order_num: 1, emoji: '🏗️' },
  { id: 'NL', slug: 'normativa', name: 'Normativa & Legislazione', description: null, order_num: 2, emoji: '⚖️' },
  { id: 'OB', slug: 'openbim', name: 'openBIM & IFC', description: null, order_num: 3, emoji: '📐' },
  { id: 'PG', slug: 'project-management', name: 'Project Management', description: null, order_num: 4, emoji: '📋' },
  { id: 'AI', slug: 'ai-bim', name: 'AI nel BIM', description: null, order_num: 5, emoji: '🤖' },
];

interface NewDiscussionFormProps {
  categories: CommunityCategory[];
  defaultCategoryId?: string;
}

export function NewDiscussionForm({ categories: propCategories, defaultCategoryId }: NewDiscussionFormProps) {
  const categories = propCategories.length > 0 ? propCategories : FALLBACK_CATEGORIES;
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(defaultCategoryId || categories[0]?.id || '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/community/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, title, body }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore durante la creazione.');
        return;
      }

      router.push(data.redirectUrl);
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Category — radio button group */}
      <fieldset>
        <legend className="block text-[0.78rem] font-medium text-text-secondary mb-2">
          Categoria
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors text-[0.82rem] ${
                cat.id === categoryId
                  ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                  : 'border-border-subtle bg-surface-2 text-text-primary hover:border-border-hover'
              }`}
            >
              <input
                type="radio"
                name="category"
                value={cat.id}
                checked={cat.id === categoryId}
                onChange={() => setCategoryId(cat.id)}
                className="sr-only"
              />
              <span>{cat.emoji}</span>
              <span className="truncate">{cat.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-[0.78rem] font-medium text-text-secondary mb-1.5">
          Titolo
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Es: Come configurare IFC export in Revit?"
          maxLength={200}
          required
          className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2.5 text-[0.82rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan transition-colors"
        />
      </div>

      {/* Body */}
      <div>
        <label htmlFor="body" className="block text-[0.78rem] font-medium text-text-secondary mb-1.5">
          Contenuto
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Descrivi nel dettaglio la tua domanda o argomento..."
          rows={8}
          required
          className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2.5 text-[0.82rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan transition-colors resize-y"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="text-[0.78rem] text-accent-rose bg-accent-rose/10 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 text-[0.78rem] font-medium text-text-muted hover:text-text-secondary transition-colors"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !body.trim()}
          className="px-5 py-2.5 bg-accent-cyan text-brand-dark font-semibold text-[0.78rem] rounded-lg hover:bg-accent-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Pubblicazione...' : 'Pubblica discussione'}
        </button>
      </div>
    </form>
  );
}
