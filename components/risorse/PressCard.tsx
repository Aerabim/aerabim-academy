import type { PressMentionDisplay } from '@/types';

interface PressCardProps {
  mention: PressMentionDisplay;
}

export function PressCard({ mention }: PressCardProps) {
  const dateLabel = new Date(mention.publishedAt).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <a
      href={mention.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 bg-surface-1 border border-border-subtle rounded-lg p-4 hover:border-border-hover transition-colors"
    >
      {/* Source logo or placeholder */}
      <div className="w-10 h-10 rounded-md bg-surface-2 flex items-center justify-center shrink-0 overflow-hidden">
        {mention.sourceLogo ? (
          <img
            src={mention.sourceLogo}
            alt={mention.sourceName}
            className="w-full h-full object-contain p-1"
          />
        ) : (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="text-text-muted/50">
            <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2v9a2 2 0 01-2 2h-2z" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-text-primary text-[0.82rem] font-semibold leading-snug mb-1 group-hover:text-accent-cyan transition-colors line-clamp-2">
          {mention.title}
        </h3>

        {mention.excerpt && (
          <p className="text-text-secondary text-[0.72rem] leading-relaxed line-clamp-2 mb-2">
            {mention.excerpt}
          </p>
        )}

        <div className="flex items-center gap-2 text-[0.65rem] text-text-muted">
          <span className="font-semibold">{mention.sourceName}</span>
          <span className="text-border-hover">·</span>
          <span>{dateLabel}</span>
        </div>
      </div>

      {/* External link icon */}
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-text-muted/40 group-hover:text-accent-cyan shrink-0 mt-0.5 transition-colors">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
      </svg>
    </a>
  );
}
