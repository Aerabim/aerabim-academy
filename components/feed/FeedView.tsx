'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { FeedItemCard } from './FeedItemCard';
import type { FeedItem, FeedItemAdminPost } from '@/types';

interface FeedViewProps {
  // reserved for future use
}

/* ── Skeleton loader ── */
function FeedSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-3 py-3.5 border-b border-border-subtle">
          <div className="w-9 h-9 rounded-full bg-surface-3 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-24 bg-surface-3 rounded" />
              <div className="h-3 w-14 bg-surface-3 rounded" />
            </div>
            <div className="h-3 w-full bg-surface-3 rounded" />
            <div className="h-3 w-2/3 bg-surface-3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── "N nuovi aggiornamenti" banner ── */
function NewItemsBanner({ count, onRefresh }: { count: number; onRefresh: () => void }) {
  return (
    <button
      onClick={onRefresh}
      className={cn(
        'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg',
        'bg-accent-cyan/10 border border-accent-cyan/25 hover:bg-accent-cyan/15 transition-colors',
        'text-[0.8rem] font-semibold text-accent-cyan',
      )}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path d="M1 4v6h6M23 20v-6h-6" />
        <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
      </svg>
      {count} {count === 1 ? 'nuovo aggiornamento' : 'nuovi aggiornamenti'} — Clicca per aggiornare
    </button>
  );
}

/* ── Main component ── */
export function FeedView(_props: FeedViewProps = {}) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [newestId, setNewestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [error, setError] = useState('');
  const [newCount, setNewCount] = useState(0);

  const newestCreatedAtRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const newestIdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setNewestIdFor(id: string) {
    if (newestIdTimerRef.current) clearTimeout(newestIdTimerRef.current);
    setNewestId(id);
    newestIdTimerRef.current = setTimeout(() => setNewestId(null), 8000);
  }

  const loadFeed = useCallback(async (offset = 0, replace = true, markNewest = false) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`/api/feed?offset=${offset}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as { items: FeedItem[]; hasMore: boolean; nextOffset: number };

      if (replace) {
        setItems(data.items);
        if (data.items.length > 0) {
          const first = data.items[0];
          // Only highlight newest when explicitly requested (user clicked banner)
          if (markNewest && newestCreatedAtRef.current && first.createdAt > newestCreatedAtRef.current) {
            setNewestIdFor(first.id);
          }
          newestCreatedAtRef.current = first.createdAt;
        }
        setNewCount(0);
      } else {
        setItems((prev) => [...prev, ...data.items]);
      }

      setHasMore(data.hasMore);
      setNextOffset(data.nextOffset);
    } catch {
      setError('Impossibile caricare il feed.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadFeed(0, true, false); }, [loadFeed]);

  // Poll every 60s for new items
  useEffect(() => {
    function scheduleNext() {
      pollTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch('/api/feed?offset=0');
          if (!res.ok) return;
          const data = await res.json() as { items: FeedItem[] };
          if (data.items.length > 0 && newestCreatedAtRef.current) {
            const newest = data.items[0].createdAt;
            if (newest > newestCreatedAtRef.current) {
              setNewCount(data.items.filter((item) => item.createdAt > newestCreatedAtRef.current!).length);
            }
          }
        } catch { /* silent */ }
        finally { scheduleNext(); }
      }, 60_000);
    }
    scheduleNext();
    return () => { if (pollTimerRef.current) clearTimeout(pollTimerRef.current); };
  }, []);

  const pinnedPosts = items.filter(
    (item): item is FeedItemAdminPost => item.type === 'admin_post' && (item as FeedItemAdminPost).isPinned,
  );
  const feedItems = items.filter(
    (item) => !(item.type === 'admin_post' && (item as FeedItemAdminPost).isPinned),
  );

  return (
    <div className="w-full">
      {newCount > 0 && (
        <div className="mb-4">
          <NewItemsBanner count={newCount} onRefresh={() => loadFeed(0, true, true)} />
        </div>
      )}

      {!loading && pinnedPosts.length > 0 && (
        <div className="space-y-3 mb-5">
          {pinnedPosts.map((item) => <FeedItemCard key={item.id} item={item} isNewest={item.id === newestId} />)}
        </div>
      )}

      <div className="bg-surface-1 border border-border-subtle rounded-lg">
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-accent-cyan shrink-0">
              <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
              <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" />
              <circle cx="12" cy="12" r="2" />
              <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" />
              <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
            </svg>
            <h2 className="text-[0.88rem] font-heading font-semibold text-text-primary">Attività recente</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadFeed(0, true, false)}
              disabled={loading}
              className="p-1.5 rounded text-text-muted hover:text-accent-cyan transition-colors disabled:opacity-30"
              title="Aggiorna feed"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                className={loading ? 'animate-spin' : ''}>
                <path d="M1 4v6h6M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5">
          {loading ? (
            <FeedSkeleton />
          ) : error ? (
            <p className="py-10 text-center text-[0.82rem] text-text-muted">{error}</p>
          ) : feedItems.length === 0 ? (
            <p className="py-10 text-center text-[0.82rem] text-text-muted">Nessuna attività recente nel feed.</p>
          ) : (
            <div>{feedItems.map((item) => <FeedItemCard key={item.id} item={item} isNewest={item.id === newestId} />)}</div>
          )}
        </div>

        {!loading && hasMore && (
          <div className="px-5 py-4 border-t border-border-subtle">
            <button
              onClick={() => loadFeed(nextOffset, false)}
              disabled={loadingMore}
              className={cn(
                'w-full text-[0.8rem] font-medium text-text-secondary hover:text-accent-cyan transition-colors',
                'py-2 rounded-sm border border-border-subtle hover:border-accent-cyan/30 disabled:opacity-40',
              )}
            >
              {loadingMore ? 'Caricamento...' : 'Carica altri'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
