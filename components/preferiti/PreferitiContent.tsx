'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AREA_CONFIG, LEVEL_LABELS } from '@/lib/area-config';
import type { CourseWithMeta, AreaCode } from '@/types';

/* ── Shared types ── */

export interface FavArticle {
  id: string;
  slug: string;
  title: string;
  area: string | null;
  coverUrl: string | null;
  readMin: number;
  authorName: string;
  excerpt: string | null;
}

export interface FavPath {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  estimatedHours: number | null;
  stepCount: number;
}

export interface FavSession {
  id: string;
  title: string;
  type: 'webinar' | 'mentoring';
  scheduledAt: string;
  durationMin: number;
  hostName: string;
  status: string;
}

/* ── Remove button ── */

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Rimuovi dai preferiti"
      className="shrink-0 p-1.5 rounded-lg text-text-muted hover:text-accent-rose hover:bg-accent-rose/10 transition-colors"
    >
      <svg width="14" height="14" fill="currentColor" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
    </button>
  );
}

/* ── Section wrapper ── */

function Section({ title, count, children, emptyIcon, emptyText, emptyHref, emptyCta }: {
  title: string;
  count: number;
  children?: React.ReactNode;
  emptyIcon: string;
  emptyText: string;
  emptyHref: string;
  emptyCta: string;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-[0.78rem] font-semibold text-text-muted uppercase tracking-wider">
        {title}{count > 0 ? ` · ${count}` : ''}
      </h2>
      {count > 0 ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <div className="flex items-center gap-4 px-4 py-5 rounded-xl border border-dashed border-border-subtle">
          <span className="text-xl opacity-40">{emptyIcon}</span>
          <span className="text-[0.78rem] text-text-muted flex-1">{emptyText}</span>
          <Link
            href={emptyHref}
            className="shrink-0 text-[0.75rem] font-semibold text-accent-cyan hover:text-accent-cyan/80 transition-colors"
          >
            {emptyCta} →
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── Corso card ── */

function CorsoCard({ corso, onRemove }: { corso: CourseWithMeta; onRemove: () => void }) {
  const area = AREA_CONFIG[corso.area as AreaCode];

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border-subtle bg-surface-1 hover:bg-surface-2 hover:border-border-hover transition-colors">
      <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden bg-surface-3">
        {corso.thumbnailUrl ? (
          <img src={corso.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className={cn('w-full h-full flex items-center justify-center text-2xl', area?.cardGradient ?? 'bg-surface-3')}>
            {area?.emoji ?? '📚'}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-wide">
            {area?.label ?? corso.area}
          </span>
          <span className="text-text-muted opacity-30">·</span>
          <span className="text-[0.65rem] font-semibold text-text-muted">
            {LEVEL_LABELS[corso.level]}
          </span>
        </div>
        <div className="text-[0.88rem] font-semibold text-text-primary truncate">{corso.title}</div>
        {corso.durationMin && (
          <div className="text-[0.72rem] text-text-muted mt-0.5">{corso.durationMin} min</div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/catalogo-corsi/${corso.slug}`}
          className="shrink-0 px-4 py-1.5 text-[0.75rem] font-semibold rounded-lg bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors"
        >
          Vedi corso
        </Link>
        <RemoveButton onClick={onRemove} />
      </div>
    </div>
  );
}

/* ── Articolo card ── */

function ArticoloCard({ articolo, onRemove }: { articolo: FavArticle; onRemove: () => void }) {
  const area = articolo.area ? AREA_CONFIG[articolo.area as AreaCode] : null;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border-subtle bg-surface-1 hover:bg-surface-2 hover:border-border-hover transition-colors">
      <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden bg-surface-3">
        {articolo.coverUrl ? (
          <img src={articolo.coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className={cn('w-full h-full flex items-center justify-center text-2xl', area?.cardGradient ?? 'bg-surface-3')}>
            {area?.emoji ?? '📄'}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {area && (
            <span className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-wide">
              {area.label}
            </span>
          )}
          <span className="text-[0.65rem] text-text-muted">{articolo.readMin} min di lettura</span>
        </div>
        <div className="text-[0.88rem] font-semibold text-text-primary truncate">{articolo.title}</div>
        {articolo.excerpt && (
          <div className="text-[0.72rem] text-text-muted mt-0.5 truncate">{articolo.excerpt}</div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/risorse/${articolo.slug}`}
          className="shrink-0 px-4 py-1.5 text-[0.75rem] font-semibold rounded-lg bg-accent-violet/15 text-accent-violet hover:bg-accent-violet/25 border border-accent-violet/20 transition-colors"
        >
          Leggi
        </Link>
        <RemoveButton onClick={onRemove} />
      </div>
    </div>
  );
}

/* ── Percorso card ── */

function PercorsoCard({ percorso, onRemove }: { percorso: FavPath; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border-subtle bg-surface-1 hover:bg-surface-2 hover:border-border-hover transition-colors">
      <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden bg-surface-3 flex items-center justify-center text-2xl">
        {percorso.thumbnailUrl ? (
          <img src={percorso.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : '🗺️'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[0.88rem] font-semibold text-text-primary truncate mb-0.5">
          {percorso.title}
        </div>
        <div className="flex items-center gap-3 text-[0.72rem] text-text-muted">
          <span>{percorso.stepCount} passi</span>
          {percorso.estimatedHours && (
            <>
              <span className="opacity-30">·</span>
              <span>~{percorso.estimatedHours}h</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/learning-paths/${percorso.slug}`}
          className="shrink-0 px-4 py-1.5 text-[0.75rem] font-semibold rounded-lg bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors"
        >
          Vedi percorso
        </Link>
        <RemoveButton onClick={onRemove} />
      </div>
    </div>
  );
}

/* ── Sessione card ── */

const SESSION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  webinar:   { label: 'Webinar',   color: 'text-accent-amber' },
  mentoring: { label: 'Mentoring', color: 'text-accent-violet' },
};

function SessioneCard({ sessione, onRemove }: { sessione: FavSession; onRemove: () => void }) {
  const typeConfig = SESSION_TYPE_LABELS[sessione.type] ?? { label: sessione.type, color: 'text-text-muted' };
  const date = new Date(sessione.scheduledAt);
  const dateStr = date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const isPast = date < new Date();

  return (
    <div className={cn(
      'flex items-center gap-4 p-4 rounded-xl border transition-colors',
      isPast
        ? 'bg-surface-1 border-border-subtle opacity-60'
        : 'bg-surface-1 border-border-subtle hover:bg-surface-2 hover:border-border-hover',
    )}>
      <div className="w-14 h-14 rounded-lg shrink-0 bg-surface-3 flex flex-col items-center justify-center gap-0.5">
        <span className="text-[0.6rem] font-bold text-text-muted uppercase">
          {date.toLocaleDateString('it-IT', { month: 'short' })}
        </span>
        <span className="text-[1.1rem] font-black text-text-primary leading-none">
          {date.getDate()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn('text-[0.65rem] font-semibold uppercase tracking-wide', typeConfig.color)}>
            {typeConfig.label}
          </span>
          <span className="text-text-muted opacity-30">·</span>
          <span className="text-[0.65rem] text-text-muted">{sessione.durationMin} min</span>
          {isPast && (
            <span className="text-[0.62rem] px-1.5 py-0.5 rounded bg-surface-3 text-text-muted font-medium">
              Concluso
            </span>
          )}
        </div>
        <div className="text-[0.88rem] font-semibold text-text-primary truncate">{sessione.title}</div>
        <div className="text-[0.72rem] text-text-muted mt-0.5">
          {dateStr} · {timeStr} · {sessione.hostName}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isPast && (
          <Link
            href="/simulazioni"
            className="shrink-0 px-4 py-1.5 text-[0.75rem] font-semibold rounded-lg bg-accent-emerald/15 text-accent-emerald hover:bg-accent-emerald/25 border border-accent-emerald/20 transition-colors"
          >
            Iscriviti
          </Link>
        )}
        <RemoveButton onClick={onRemove} />
      </div>
    </div>
  );
}

/* ── Main component ── */

interface PreferitiContentProps {
  corsi: CourseWithMeta[];
  articoli: FavArticle[];
  percorsi: FavPath[];
  sessioni: FavSession[];
}

export function PreferitiContent({ corsi, articoli, percorsi, sessioni }: PreferitiContentProps) {
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  async function remove(itemType: string, itemId: string) {
    setRemoved((prev) => new Set([...prev, `${itemType}:${itemId}`]));
    try {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType, itemId }),
      });
    } catch {
      setRemoved((prev) => {
        const next = new Set(prev);
        next.delete(`${itemType}:${itemId}`);
        return next;
      });
    }
  }

  const visibleCorsi    = corsi.filter((c) => !removed.has(`course:${c.id}`));
  const visibleArticoli = articoli.filter((a) => !removed.has(`article:${a.id}`));
  const visiblePercorsi = percorsi.filter((p) => !removed.has(`path:${p.id}`));
  const visibleSessioni = sessioni.filter((s) => !removed.has(`session:${s.id}`));

  if (corsi.length + articoli.length + percorsi.length + sessioni.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border-subtle flex items-center justify-center mb-5">
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="text-text-muted">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        </div>
        <h2 className="font-heading text-[1rem] font-bold text-text-primary mb-2">
          Nessun preferito ancora
        </h2>
        <p className="text-[0.82rem] text-text-secondary max-w-sm leading-relaxed mb-6">
          Salva corsi, articoli, percorsi ed esami cliccando il segnalibro. Li trovi tutti qui.
        </p>
        <Link
          href="/catalogo-corsi"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-[0.82rem] font-semibold rounded-lg bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors"
        >
          Esplora il catalogo →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Section
        title="Corsi"
        count={visibleCorsi.length}
        emptyIcon="📚"
        emptyText="Nessun corso nei preferiti"
        emptyHref="/catalogo-corsi"
        emptyCta="Esplora il catalogo"
      >
        {visibleCorsi.map((c) => (
          <CorsoCard key={c.id} corso={c} onRemove={() => remove('course', c.id)} />
        ))}
      </Section>

      <Section
        title="Risorse"
        count={visibleArticoli.length}
        emptyIcon="📄"
        emptyText="Nessun articolo nei preferiti"
        emptyHref="/risorse"
        emptyCta="Esplora le risorse"
      >
        {visibleArticoli.map((a) => (
          <ArticoloCard key={a.id} articolo={a} onRemove={() => remove('article', a.id)} />
        ))}
      </Section>

      <Section
        title="Percorsi"
        count={visiblePercorsi.length}
        emptyIcon="🗺️"
        emptyText="Nessun percorso nei preferiti"
        emptyHref="/learning-paths"
        emptyCta="Esplora i percorsi"
      >
        {visiblePercorsi.map((p) => (
          <PercorsoCard key={p.id} percorso={p} onRemove={() => remove('path', p.id)} />
        ))}
      </Section>

      <Section
        title="Esami"
        count={visibleSessioni.length}
        emptyIcon="🎓"
        emptyText="Nessun esame nei preferiti"
        emptyHref="/simulazioni"
        emptyCta="Esplora gli esami"
      >
        {visibleSessioni.map((s) => (
          <SessioneCard key={s.id} sessione={s} onRemove={() => remove('session', s.id)} />
        ))}
      </Section>
    </div>
  );
}
