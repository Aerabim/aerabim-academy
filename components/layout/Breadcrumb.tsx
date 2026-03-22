'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Maps route segments to readable Italian labels */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  'catalogo-corsi': 'Catalogo Corsi',
  'i-miei-corsi': 'I Miei Corsi',
  certificati: 'Certificati',
  'learning-paths': 'Learning Paths',
  'sessioni-live': 'Sessioni Live',
  community: 'Community',
  profilo: 'Profilo',
  impostazioni: 'Impostazioni',
  'ai-tutor': 'AI Tutor',
  notifiche: 'Notifiche',
  assistenza: 'Assistenza',
  preferiti: 'Preferiti',
  learn: 'Corso',
};

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

interface Crumb {
  label: string;
  href: string;
}

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const href = '/' + segments.slice(0, i + 1).join('/');

    // Skip UUID segments — they are dynamic params (courseId, lessonId)
    // Their context is provided by the parent crumb
    if (isUuid(segment)) continue;

    const label = SEGMENT_LABELS[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label, href });
  }

  return crumbs;
}

export function Breadcrumb() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;

        return (
          <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && (
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-text-muted shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            )}
            {isLast ? (
              <span className="text-[0.78rem] font-semibold text-text-primary truncate">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-[0.78rem] text-text-muted hover:text-text-secondary transition-colors truncate"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
