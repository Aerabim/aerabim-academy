'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormField } from '@/components/admin/ui/FormField';
import { FormTextarea } from '@/components/admin/ui/FormTextarea';
import { FeedMediaUploader } from './FeedMediaUploader';
import { timeAgo } from '@/lib/utils';
import type { AdminFeedPost } from '@/types';

interface FeedPostsManagerProps {
  initial: AdminFeedPost[];
}

export function FeedPostsManager({ initial }: FeedPostsManagerProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminFeedPost[]>(initial);

  // Sync local state whenever the server re-renders with fresh data (after router.refresh())
  useEffect(() => {
    setPosts(initial);
  }, [initial]);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [href, setHref] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  // Temporary post ID used while the form is open (for Mux upload passthrough)
  const [draftId, setDraftId] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  async function openForm() {
    // Create a draft post so we have an ID for Mux passthrough before the form is submitted
    try {
      const res = await fetch('/api/admin/feed/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '__draft__', body: '__draft__', isPublished: false }),
      });
      if (res.ok) {
        const data = await res.json() as { id?: string };
        if (data.id) setDraftId(data.id);
      }
    } catch {
      // If draft creation fails, still open the form; video upload just won't be available
    }
    setShowForm(true);
  }

  function resetForm() {
    setTitle('');
    setBody('');
    setHref('');
    setIsPinned(false);
    setIsPublished(true);
    setMediaType(null);
    setMediaUrl(null);
    setDraftId(null);
    setError('');
    setShowForm(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (draftId) {
        // Update the draft in place
        const res = await fetch(`/api/admin/feed/posts/${draftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            body,
            href: href || null,
            isPinned,
            isPublished,
            mediaType: mediaType ?? null,
            mediaUrl: mediaUrl ?? null,
          }),
        });
        if (!res.ok) {
          const data = await res.json() as { error?: string };
          setError(data.error ?? 'Errore durante il salvataggio.');
          return;
        }

        // Optimistic update
        const newPost: AdminFeedPost = {
          id: draftId,
          title,
          body,
          href: href || null,
          isPinned,
          isPublished,
          createdAt: new Date().toISOString(),
          mediaType,
          mediaUrl,
        };
        setPosts((prev) => [newPost, ...prev.filter((p) => p.id !== draftId)]);
      } else {
        // No draft ID — create fresh
        const res = await fetch('/api/admin/feed/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body, href: href || undefined, isPinned, isPublished, mediaType, mediaUrl }),
        });

        const data = await res.json() as { id?: string; error?: string };
        if (!res.ok) {
          setError(data.error ?? 'Errore durante la creazione.');
          return;
        }

        const newPost: AdminFeedPost = {
          id: data.id!,
          title,
          body,
          href: href || null,
          isPinned,
          isPublished,
          createdAt: new Date().toISOString(),
          mediaType,
          mediaUrl,
        };
        setPosts((prev) => [newPost, ...prev]);
      }

      resetForm();
      router.refresh();
    } catch {
      setError('Errore di rete.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublished(post: AdminFeedPost) {
    const updated = { ...post, isPublished: !post.isPublished };
    setPosts((prev) => prev.map((p) => p.id === post.id ? updated : p));

    try {
      await fetch(`/api/admin/feed/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: updated.isPublished }),
      });
    } catch {
      setPosts((prev) => prev.map((p) => p.id === post.id ? post : p));
    }
  }

  async function handleTogglePinned(post: AdminFeedPost) {
    const updated = { ...post, isPinned: !post.isPinned };
    setPosts((prev) => prev.map((p) => p.id === post.id ? updated : p));

    try {
      await fetch(`/api/admin/feed/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: updated.isPinned }),
      });
    } catch {
      setPosts((prev) => prev.map((p) => p.id === post.id ? post : p));
    }
  }

  async function handleDelete(postId: string) {
    setDeleting(postId);
    try {
      const res = await fetch(`/api/admin/feed/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        router.refresh();
      }
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header + nuovo post */}
      <div className="flex items-center justify-between">
        <span className="text-[0.78rem] text-text-muted">{posts.length} {posts.length === 1 ? 'post' : 'post'}</span>
        {!showForm && (
          <button
            onClick={openForm}
            className="flex items-center gap-1.5 text-[0.78rem] font-semibold text-accent-cyan hover:text-accent-cyan/80 transition-colors"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuovo post
          </button>
        )}
      </div>

      {/* Form nuovo post */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface-2 border border-border-subtle rounded-lg p-5 space-y-4">
          <h3 className="font-heading text-[0.88rem] font-bold text-text-primary">Nuovo post editoriale</h3>

          {error && (
            <div className="text-[0.78rem] text-accent-rose bg-accent-rose/10 border border-accent-rose/20 rounded px-3 py-2">
              {error}
            </div>
          )}

          <FormField label="Titolo" id="post-title" value={title} onChange={setTitle} required placeholder="es. Aggiornamento piattaforma" />
          <FormTextarea label="Testo" id="post-body" value={body} onChange={setBody} required rows={3} placeholder="Descrizione del comunicato..." />
          <FormField label="Link (opzionale)" id="post-href" value={href} onChange={setHref} placeholder="https://..." hint="Lascia vuoto se non c'è una pagina di riferimento." />

          {/* Media */}
          <div>
            <label className="block text-[0.78rem] font-medium text-text-secondary mb-2">Media (opzionale)</label>
            {draftId ? (
              <FeedMediaUploader
                postId={draftId}
                currentType={mediaType}
                currentUrl={mediaUrl}
                onComplete={(type, url) => { setMediaType(type); setMediaUrl(url); }}
                onClear={() => { setMediaType(null); setMediaUrl(null); }}
              />
            ) : (
              <p className="text-[0.72rem] text-text-muted">Il media potrà essere aggiunto dopo la creazione del post.</p>
            )}
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded border-border-subtle bg-surface-2 text-accent-cyan focus:ring-accent-cyan/20" />
              <span className="text-[0.8rem] text-text-secondary">📌 Fissa in cima</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded border-border-subtle bg-surface-2 text-accent-cyan focus:ring-accent-cyan/20" />
              <span className="text-[0.8rem] text-text-secondary">Pubblica subito</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="text-[0.8rem] font-semibold bg-accent-cyan text-brand-dark px-4 py-2 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
              {saving ? 'Salvataggio...' : 'Crea post'}
            </button>
            <button type="button" onClick={resetForm}
              className="text-[0.8rem] text-text-muted hover:text-text-primary transition-colors">
              Annulla
            </button>
          </div>
        </form>
      )}

      {/* Lista post */}
      {posts.filter((p) => p.title !== '__draft__').length === 0 ? (
        <p className="text-center py-8 text-[0.82rem] text-text-muted">Nessun post creato.</p>
      ) : (
        <div className="divide-y divide-border-subtle">
          {posts.filter((p) => p.title !== '__draft__').map((post) => (
            <div key={post.id} className="py-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[0.84rem] font-semibold text-text-primary">{post.title}</span>
                  {post.isPinned && <span className="text-[0.65rem] text-accent-amber">📌 Fissato</span>}
                  {post.mediaType && (
                    <span className="text-[0.6rem] font-bold uppercase tracking-wide text-text-muted bg-surface-3 px-1.5 py-[2px] rounded">
                      {post.mediaType === 'image' ? '🖼 Immagine' : '🎬 Video'}
                    </span>
                  )}
                  {!post.isPublished && (
                    <span className="text-[0.62rem] font-bold uppercase tracking-wide text-text-muted bg-surface-3 px-1.5 py-[2px] rounded">
                      Bozza
                    </span>
                  )}
                </div>
                <p className="text-[0.76rem] text-text-muted mt-0.5 line-clamp-2">{post.body}</p>
                <span className="text-[0.68rem] text-text-muted">{timeAgo(post.createdAt)}</span>
              </div>

              {/* Azioni */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTogglePinned(post)}
                  title={post.isPinned ? 'Rimuovi pin' : 'Fissa in cima'}
                  className="p-1.5 rounded text-text-muted hover:text-accent-amber transition-colors"
                >
                  <svg width="14" height="14" fill={post.isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className={post.isPinned ? 'text-accent-amber' : ''}>
                    <line x1="12" y1="17" x2="12" y2="22" />
                    <path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17z" />
                  </svg>
                </button>

                <button
                  onClick={() => handleTogglePublished(post)}
                  title={post.isPublished ? 'Metti in bozza' : 'Pubblica'}
                  className="p-1.5 rounded text-text-muted hover:text-accent-emerald transition-colors"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className={post.isPublished ? 'text-accent-emerald' : ''}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>

                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={deleting === post.id}
                  title="Elimina"
                  className="p-1.5 rounded text-text-muted hover:text-accent-rose transition-colors disabled:opacity-40"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
