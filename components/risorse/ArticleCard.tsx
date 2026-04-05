import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { BookmarkButton } from '@/components/ui/BookmarkButton';
import { AREA_CONFIG } from '@/lib/area-config';
import type { ArticleDisplay, AreaCode } from '@/types';

interface ArticleCardProps {
  article: ArticleDisplay;
  initialFavorited?: boolean;
}

export function ArticleCard({ article, initialFavorited = false }: ArticleCardProps) {
  const area = article.area ? AREA_CONFIG[article.area as AreaCode] : null;

  const dateLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="group relative bg-surface-1 border border-border-subtle rounded-lg overflow-hidden hover:border-border-hover transition-colors">
      {/* Cover image */}
      {article.coverUrl ? (
        <div className="aspect-[16/9] bg-surface-2 overflow-hidden">
          <img
            src={article.coverUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-brand-blue/20 to-accent-cyan/10 flex items-center justify-center">
          <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24" className="text-text-muted/40">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8M16 17H8M10 9H8" />
          </svg>
        </div>
      )}

      {/* Bookmark button — top-right corner */}
      <div className="absolute top-2.5 right-2.5 z-20">
        <BookmarkButton
          itemType="article"
          itemId={article.id}
          initialFavorited={initialFavorited}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Tags */}
        <div className="flex items-center gap-2 mb-2">
          {area && (
            <Badge variant={area.badgeVariant}>{area.label}</Badge>
          )}
          <span className="text-text-muted text-[0.65rem]">{article.readMin} min di lettura</span>
        </div>

        {/* Title */}
        <h3 className="text-text-primary text-[0.9rem] font-semibold leading-snug mb-1.5 group-hover:text-accent-cyan transition-colors line-clamp-2">
          {article.title}
        </h3>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-text-secondary text-[0.75rem] leading-relaxed line-clamp-2 mb-3">
            {article.excerpt}
          </p>
        )}

        {/* Footer: author + date */}
        <div className="flex items-center justify-between text-[0.67rem] text-text-muted">
          <span>{article.authorName}</span>
          <span>{dateLabel}</span>
        </div>
      </div>

      {/* Full card link — behind bookmark button */}
      <Link href={`/risorse/${article.slug}`} className="absolute inset-0 z-10" aria-label={article.title} />
    </div>
  );
}
