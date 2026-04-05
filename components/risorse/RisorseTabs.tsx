'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ArticleCard } from '@/components/risorse/ArticleCard';
import { PressCard } from '@/components/risorse/PressCard';
import type { ArticleDisplay, PressMentionDisplay, AreaCode } from '@/types';
import { AREA_CONFIG } from '@/lib/area-config';

type Tab = 'articoli' | 'press';
type AreaFilter = AreaCode | 'all';

interface RisorseTabsProps {
  articles: ArticleDisplay[];
  pressMentions: PressMentionDisplay[];
  favoriteArticleIds?: Set<string>;
}

const AREA_FILTERS: { value: AreaFilter; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'SW', label: 'Software' },
  { value: 'NL', label: 'Normativa' },
  { value: 'OB', label: 'openBIM' },
  { value: 'PG', label: 'Project Mgmt' },
  { value: 'AI', label: 'AI' },
];

export function RisorseTabs({ articles, pressMentions, favoriteArticleIds = new Set() }: RisorseTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('articoli');
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('all');

  const filteredArticles = areaFilter === 'all'
    ? articles
    : articles.filter((a) => a.area === areaFilter);

  const hasPress = pressMentions.length > 0;

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5">
        <button
          onClick={() => setActiveTab('articoli')}
          className={cn(
            'px-4 py-2 rounded-md text-[0.82rem] font-semibold transition-colors',
            activeTab === 'articoli'
              ? 'bg-accent-cyan/15 text-accent-cyan'
              : 'text-text-muted hover:text-text-secondary hover:bg-surface-2',
          )}
        >
          Articoli
          {articles.length > 0 && (
            <span className="ml-1.5 text-[0.65rem] opacity-70">{articles.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('press')}
          className={cn(
            'px-4 py-2 rounded-md text-[0.82rem] font-semibold transition-colors',
            activeTab === 'press'
              ? 'bg-accent-cyan/15 text-accent-cyan'
              : 'text-text-muted hover:text-text-secondary hover:bg-surface-2',
          )}
        >
          Press
          {pressMentions.length > 0 && (
            <span className="ml-1.5 text-[0.65rem] opacity-70">{pressMentions.length}</span>
          )}
        </button>
      </div>

      {/* Articles tab */}
      {activeTab === 'articoli' && (
        <>
          {/* Area filter pills */}
          {articles.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-5">
              {AREA_FILTERS.map((f) => {
                const area = f.value !== 'all' ? AREA_CONFIG[f.value] : null;
                return (
                  <button
                    key={f.value}
                    onClick={() => setAreaFilter(f.value)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-[0.7rem] font-medium transition-colors',
                      areaFilter === f.value
                        ? 'bg-accent-cyan/15 text-accent-cyan'
                        : 'bg-surface-2 text-text-muted hover:text-text-secondary',
                    )}
                  >
                    {area ? `${area.emoji} ${f.label}` : f.label}
                  </button>
                );
              })}
            </div>
          )}

          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  initialFavorited={favoriteArticleIds.has(article.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              message={
                areaFilter !== 'all'
                  ? 'Nessun articolo in questa categoria.'
                  : 'Nessun articolo pubblicato ancora. Torna presto!'
              }
            />
          )}
        </>
      )}

      {/* Press tab */}
      {activeTab === 'press' && (
        <>
          {hasPress ? (
            <div className="space-y-3">
              {pressMentions.map((mention) => (
                <PressCard key={mention.id} mention={mention} />
              ))}
            </div>
          ) : (
            <EmptyState message="Nessuna rassegna stampa disponibile al momento." />
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-surface-1 border border-border-subtle rounded-lg p-10 text-center">
      <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24" className="text-text-muted/30 mx-auto mb-3">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8M16 17H8M10 9H8" />
      </svg>
      <p className="text-text-muted text-[0.82rem]">{message}</p>
    </div>
  );
}
