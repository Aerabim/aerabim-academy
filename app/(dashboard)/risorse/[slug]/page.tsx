import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { AREA_CONFIG } from '@/lib/area-config';
import { getArticleBySlug } from '@/lib/risorse/queries';
import type { AreaCode } from '@/types';

interface PageProps {
  params: { slug: string };
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const supabase = createServerClient();
  const article = await getArticleBySlug(supabase, params.slug);

  if (!article) notFound();

  const area = article.area ? AREA_CONFIG[article.area as AreaCode] : null;

  const dateLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="w-full px-6 lg:px-9 py-7">
      {/* Back link */}
      <Link
        href="/risorse"
        className="inline-flex items-center gap-1.5 text-text-muted text-[0.78rem] hover:text-text-secondary transition-colors mb-5"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 3L4.5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Torna alle risorse
      </Link>

      {/* Article layout */}
      <article className="max-w-[720px]">
        {/* Tags */}
        <div className="flex items-center gap-2 mb-3">
          {area && <Badge variant={area.badgeVariant}>{area.fullLabel}</Badge>}
          <span className="text-text-muted text-[0.68rem]">{article.readMin} min di lettura</span>
        </div>

        {/* Title */}
        <h1 className="font-heading text-xl lg:text-[1.7rem] font-extrabold text-text-primary leading-tight mb-4">
          {article.title}
        </h1>

        {/* Author + date */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-cyan to-brand-blue flex items-center justify-center text-[0.7rem] font-bold text-brand-dark">
            {article.authorName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-text-primary text-[0.8rem] font-semibold">{article.authorName}</p>
            <p className="text-text-muted text-[0.68rem]">{article.authorRole} · {dateLabel}</p>
          </div>
        </div>

        {/* Cover image */}
        {article.coverUrl && (
          <div className="rounded-lg overflow-hidden mb-7">
            <img
              src={article.coverUrl}
              alt={article.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Body — rendered as HTML paragraphs split by double newlines */}
        <div className="prose-aerabim">
          {article.body.split('\n\n').map((paragraph, i) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return null;

            // Heading detection (## or ###)
            if (trimmed.startsWith('### ')) {
              return (
                <h3 key={i} className="font-heading text-[1rem] font-bold text-text-primary mt-7 mb-3">
                  {trimmed.slice(4)}
                </h3>
              );
            }
            if (trimmed.startsWith('## ')) {
              return (
                <h2 key={i} className="font-heading text-[1.15rem] font-bold text-text-primary mt-8 mb-3">
                  {trimmed.slice(3)}
                </h2>
              );
            }

            // Bullet list detection
            if (trimmed.split('\n').every((line) => line.startsWith('- ') || line.startsWith('* '))) {
              return (
                <ul key={i} className="list-disc list-inside space-y-1 my-4 text-text-secondary text-[0.85rem] leading-relaxed">
                  {trimmed.split('\n').map((line, j) => (
                    <li key={j}>{line.replace(/^[-*]\s/, '')}</li>
                  ))}
                </ul>
              );
            }

            return (
              <p key={i} className="text-text-secondary text-[0.85rem] leading-[1.75] mb-4">
                {trimmed}
              </p>
            );
          })}
        </div>

        {/* Related course CTA */}
        {article.relatedCourseSlug && article.relatedCourseTitle && (
          <div className="mt-10 bg-surface-1 border border-border-subtle rounded-lg p-5">
            <p className="text-text-muted text-[0.7rem] uppercase tracking-wider font-bold mb-2">Corso correlato</p>
            <Link
              href={`/catalogo-corsi/${article.relatedCourseSlug}`}
              className="inline-flex items-center gap-2 text-accent-cyan text-[0.88rem] font-semibold hover:underline"
            >
              {article.relatedCourseTitle}
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </article>
    </div>
  );
}
