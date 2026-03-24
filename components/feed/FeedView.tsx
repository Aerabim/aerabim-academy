'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface FeedSession {
  id: string;
  type: string;
  title: string;
  hostName: string;
  scheduledAt: string;
  durationMin: number;
  status: string;
  bookedCount: number;
  maxParticipants: number | null;
  isBooked: boolean;
}

interface FeedDiscussion {
  id: string;
  title: string;
  categoryName: string;
  categoryEmoji: string | null;
  replyCount: number;
  authorName: string;
  createdAt: string;
}

interface FeedArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  area: string | null;
  authorName: string;
  publishedAt: string;
  readMin: number;
}

interface FeedData {
  sessions: FeedSession[];
  discussions: FeedDiscussion[];
  articles: FeedArticle[];
}

function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
    + ' · ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export function FeedView() {
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/feed');
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Feed fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16 text-[0.82rem] text-text-muted">Caricamento...</div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-[0.82rem] text-text-muted">Impossibile caricare il feed.</div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sessioni Live imminenti */}
      <section className="bg-surface-1 border border-border-subtle rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle flex items-center gap-2">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-accent-amber shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h2 className="text-[0.88rem] font-heading font-semibold text-text-primary">Prossime sessioni</h2>
        </div>
        <div className="divide-y divide-border-subtle">
          {data.sessions.length === 0 ? (
            <div className="px-5 py-8 text-center text-[0.82rem] text-text-muted">
              Nessuna sessione in programma.
            </div>
          ) : (
            data.sessions.map((s) => (
              <Link
                key={s.id}
                href="/sessioni-live"
                className="block px-5 py-3.5 hover:bg-surface-2/30 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.82rem] font-medium text-text-primary truncate">{s.title}</div>
                    <div className="text-[0.72rem] text-text-muted mt-0.5">{s.hostName}</div>
                  </div>
                  <Badge variant={s.type === 'webinar' ? 'cyan' : 'amber'}>
                    {s.type === 'webinar' ? 'Webinar' : 'Mentoring'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[0.72rem] text-accent-cyan font-medium">
                    {formatSessionDate(s.scheduledAt)}
                  </span>
                  <span className="text-[0.68rem] text-text-muted">
                    {s.durationMin} min
                  </span>
                  {s.isBooked && (
                    <span className="text-[0.68rem] text-accent-emerald font-medium">Prenotato</span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
        <div className="px-5 py-3 border-t border-border-subtle">
          <Link href="/sessioni-live" className="text-[0.78rem] text-accent-cyan hover:underline font-medium">
            Vedi tutte le sessioni
          </Link>
        </div>
      </section>

      {/* Discussioni recenti */}
      <section className="bg-surface-1 border border-border-subtle rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle flex items-center gap-2">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-accent-cyan shrink-0">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <h2 className="text-[0.88rem] font-heading font-semibold text-text-primary">Discussioni recenti</h2>
        </div>
        <div className="divide-y divide-border-subtle">
          {data.discussions.length === 0 ? (
            <div className="px-5 py-8 text-center text-[0.82rem] text-text-muted">
              Nessuna discussione recente.
            </div>
          ) : (
            data.discussions.map((d) => (
              <Link
                key={d.id}
                href={`/community/${d.id}`}
                className="block px-5 py-3.5 hover:bg-surface-2/30 transition-colors"
              >
                <div className="text-[0.82rem] font-medium text-text-primary line-clamp-2">{d.title}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[0.68rem] text-text-muted">
                    {d.categoryEmoji ? `${d.categoryEmoji} ` : ''}{d.categoryName}
                  </span>
                  <span className="text-[0.68rem] text-text-muted">·</span>
                  <span className="text-[0.68rem] text-text-muted">{d.authorName}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[0.68rem] text-text-muted">{timeAgo(d.createdAt)}</span>
                  {d.replyCount > 0 && (
                    <span className="text-[0.68rem] text-accent-cyan font-medium">
                      {d.replyCount} {d.replyCount === 1 ? 'risposta' : 'risposte'}
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
        <div className="px-5 py-3 border-t border-border-subtle">
          <Link href="/community" className="text-[0.78rem] text-accent-cyan hover:underline font-medium">
            Vai alla community
          </Link>
        </div>
      </section>

      {/* Ultime risorse */}
      <section className="bg-surface-1 border border-border-subtle rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle flex items-center gap-2">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-accent-emerald shrink-0">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8M16 17H8M10 9H8" />
          </svg>
          <h2 className="text-[0.88rem] font-heading font-semibold text-text-primary">Ultime risorse</h2>
        </div>
        <div className="divide-y divide-border-subtle">
          {data.articles.length === 0 ? (
            <div className="px-5 py-8 text-center text-[0.82rem] text-text-muted">
              Nessun articolo pubblicato.
            </div>
          ) : (
            data.articles.map((a) => (
              <Link
                key={a.id}
                href={`/risorse/${a.slug}`}
                className="block px-5 py-3.5 hover:bg-surface-2/30 transition-colors"
              >
                <div className="text-[0.82rem] font-medium text-text-primary line-clamp-2">{a.title}</div>
                {a.excerpt && (
                  <div className="text-[0.72rem] text-text-muted mt-1 line-clamp-2">{a.excerpt}</div>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[0.68rem] text-text-muted">{a.authorName}</span>
                  <span className="text-[0.68rem] text-text-muted">·</span>
                  <span className="text-[0.68rem] text-text-muted">{a.readMin} min lettura</span>
                  <span className="text-[0.68rem] text-text-muted">·</span>
                  <span className="text-[0.68rem] text-text-muted">{timeAgo(a.publishedAt)}</span>
                </div>
              </Link>
            ))
          )}
        </div>
        <div className="px-5 py-3 border-t border-border-subtle">
          <Link href="/risorse" className="text-[0.78rem] text-accent-cyan hover:underline font-medium">
            Vedi tutte le risorse
          </Link>
        </div>
      </section>
    </div>
  );
}
