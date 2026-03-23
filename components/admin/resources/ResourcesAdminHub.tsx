'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { timeAgo } from '@/lib/utils';

type Tab = 'articles' | 'press';

interface ArticleItem {
  id: string; slug: string; title: string; area: string | null;
  author_name: string; is_published: boolean; published_at: string; read_min: number;
}

interface PressItem {
  id: string; title: string; source_name: string; source_url: string;
  is_published: boolean; published_at: string;
}

export function ResourcesAdminHub() {
  const [tab, setTab] = useState<Tab>('articles');
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [press, setPress] = useState<PressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: Tab; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [artRes, pressRes] = await Promise.all([
        fetch('/api/admin/articles'),
        fetch('/api/admin/press'),
      ]);
      if (artRes.ok) {
        const data = await artRes.json();
        setArticles(data.articles ?? []);
      }
      if (pressRes.ok) {
        const data = await pressRes.json();
        setPress(data.pressMentions ?? []);
      }
    } catch (err) {
      console.error('Load resources error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function togglePublish(id: string, type: Tab, currentValue: boolean) {
    const url = type === 'articles' ? `/api/admin/articles/${id}` : `/api/admin/press/${id}`;
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentValue }),
      });
      if (res.ok) {
        if (type === 'articles') {
          setArticles((prev) => prev.map((a) => a.id === id ? { ...a, is_published: !currentValue } : a));
        } else {
          setPress((prev) => prev.map((p) => p.id === id ? { ...p, is_published: !currentValue } : p));
        }
      }
    } catch (err) {
      console.error('Toggle publish error:', err);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const url = deleteTarget.type === 'articles'
        ? `/api/admin/articles/${deleteTarget.id}`
        : `/api/admin/press/${deleteTarget.id}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) {
        if (deleteTarget.type === 'articles') {
          setArticles((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        } else {
          setPress((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <>
      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('articles')}
          className={cn(
            'px-4 py-2 text-[0.82rem] font-medium rounded-md transition-colors',
            tab === 'articles' ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20' : 'text-text-muted bg-surface-2 border border-border-subtle hover:text-text-primary',
          )}
        >
          Articoli ({articles.length})
        </button>
        <button
          onClick={() => setTab('press')}
          className={cn(
            'px-4 py-2 text-[0.82rem] font-medium rounded-md transition-colors',
            tab === 'press' ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20' : 'text-text-muted bg-surface-2 border border-border-subtle hover:text-text-primary',
          )}
        >
          Rassegna Stampa ({press.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center text-[0.82rem] text-text-muted py-10">Caricamento...</div>
      ) : tab === 'articles' ? (
        <div className="overflow-x-auto border border-border-subtle rounded-lg">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-2/50">
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Titolo</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Autore</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Lettura</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Stato</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[0.82rem] text-text-muted">Nessun articolo.</td></tr>
              ) : articles.map((a) => (
                <tr key={a.id} className="border-b border-border-subtle last:border-b-0 hover:bg-surface-2/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-[0.82rem] font-medium text-text-primary">{a.title}</div>
                    <div className="text-[0.7rem] text-text-muted">/{a.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-[0.82rem] text-text-secondary">{a.author_name}</td>
                  <td className="px-4 py-3 text-[0.82rem] text-text-muted">{a.read_min} min</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublish(a.id, 'articles', a.is_published)}
                      className={cn(
                        'text-[0.72rem] font-semibold px-2.5 py-1 rounded-md transition-colors',
                        a.is_published ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-surface-3 text-text-muted',
                      )}
                    >
                      {a.is_published ? 'Pubblicato' : 'Bozza'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDeleteTarget({ id: a.id, type: 'articles', title: a.title })} className="text-[0.78rem] text-accent-rose hover:underline">Elimina</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border-subtle rounded-lg">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-2/50">
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Titolo</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Fonte</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Stato</th>
                <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {press.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-[0.82rem] text-text-muted">Nessuna menzione.</td></tr>
              ) : press.map((p) => (
                <tr key={p.id} className="border-b border-border-subtle last:border-b-0 hover:bg-surface-2/30 transition-colors">
                  <td className="px-4 py-3 text-[0.82rem] font-medium text-text-primary">{p.title}</td>
                  <td className="px-4 py-3 text-[0.82rem] text-text-secondary">{p.source_name}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublish(p.id, 'press', p.is_published)}
                      className={cn(
                        'text-[0.72rem] font-semibold px-2.5 py-1 rounded-md transition-colors',
                        p.is_published ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-surface-3 text-text-muted',
                      )}
                    >
                      {p.is_published ? 'Pubblicato' : 'Bozza'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDeleteTarget({ id: p.id, type: 'press', title: p.title })} className="text-[0.78rem] text-accent-rose hover:underline">Elimina</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Elimina risorsa"
        message={`Eliminare "${deleteTarget?.title}"?`}
        confirmLabel="Elimina"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
