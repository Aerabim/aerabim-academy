import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AREA_CONFIG, LEVEL_LABELS } from '@/lib/area-config';
import type { LibreriaCorso, LibreriaRisorsa, LibreriaPercorso } from './types';

/* ── Resource type label + icon ── */

const RESOURCE_TYPE_CONFIG = {
  pdf:  { label: 'PDF',      icon: '📄' },
  zip:  { label: 'Template', icon: '📦' },
  link: { label: 'Link',     icon: '🔗' },
} as const;

/* ── Section wrapper ── */

function Section({ title, children, empty }: {
  title: string;
  children: React.ReactNode;
  empty?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-[0.78rem] font-semibold text-text-muted uppercase tracking-wider">
        {title}
      </h2>
      {children ?? empty}
    </div>
  );
}

/* ── Corso card ── */

function CorsoCard({ corso }: { corso: LibreriaCorso }) {
  const area = AREA_CONFIG[corso.area];
  const isExpired = corso.expiresAt && new Date(corso.expiresAt) < new Date();

  return (
    <div className={cn(
      'flex items-center gap-4 p-4 rounded-xl border transition-colors',
      isExpired
        ? 'bg-surface-1 border-border-subtle opacity-60'
        : 'bg-surface-1 border-border-subtle hover:bg-surface-2 hover:border-border-hover',
    )}>
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden bg-surface-3">
        {corso.thumbnailUrl ? (
          <img src={corso.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className={cn('w-full h-full flex items-center justify-center text-2xl', area?.cardGradient ?? 'bg-surface-3')}>
            {area?.emoji ?? '📚'}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-wide">
            {area?.label ?? corso.area}
          </span>
          <span className="text-text-muted opacity-30">·</span>
          <span className="text-[0.65rem] font-semibold text-text-muted">
            {LEVEL_LABELS[corso.level]}
          </span>
          {isExpired && (
            <span className="text-[0.62rem] px-1.5 py-0.5 rounded bg-accent-rose/10 text-accent-rose border border-accent-rose/20 font-medium">
              Scaduto
            </span>
          )}
        </div>
        <div className="text-[0.88rem] font-semibold text-text-primary truncate">
          {corso.title}
        </div>
        {corso.durationMin && (
          <div className="text-[0.72rem] text-text-muted mt-0.5">
            {corso.durationMin} min
          </div>
        )}
      </div>

      {/* CTA */}
      {!isExpired && (
        <Link
          href={`/learn/${corso.id}`}
          className="shrink-0 px-4 py-1.5 text-[0.75rem] font-semibold rounded-lg bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors"
        >
          Vai al corso
        </Link>
      )}
    </div>
  );
}

/* ── Risorsa card ── */

function RisorsaCard({ risorsa }: { risorsa: LibreriaRisorsa }) {
  const config = RESOURCE_TYPE_CONFIG[risorsa.type];

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border-subtle bg-surface-1 hover:bg-surface-2 hover:border-border-hover transition-colors">
      {/* Icon / thumbnail */}
      <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden bg-surface-3 flex items-center justify-center text-2xl">
        {risorsa.thumbnailUrl ? (
          <img src={risorsa.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          config.icon
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-wide">
            {config.label}
          </span>
        </div>
        <div className="text-[0.88rem] font-semibold text-text-primary truncate">
          {risorsa.title}
        </div>
        <div className="text-[0.72rem] text-text-muted mt-0.5">
          Acquistato il {new Date(risorsa.purchasedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/risorse/${risorsa.slug}`}
        className="shrink-0 px-4 py-1.5 text-[0.75rem] font-semibold rounded-lg bg-accent-violet/15 text-accent-violet hover:bg-accent-violet/25 border border-accent-violet/20 transition-colors"
      >
        {risorsa.type === 'link' ? 'Apri' : 'Scarica'}
      </Link>
    </div>
  );
}

/* ── Percorso card ── */

function PercorsoCard({ percorso }: { percorso: LibreriaPercorso }) {
  const pct = percorso.stepCount > 0
    ? Math.round((percorso.completedSteps / percorso.stepCount) * 100)
    : 0;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border-subtle bg-surface-1 hover:bg-surface-2 hover:border-border-hover transition-colors">
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden bg-surface-3 flex items-center justify-center text-2xl">
        {percorso.thumbnailUrl ? (
          <img src={percorso.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          percorso.isCompleted ? '✅' : '🗺️'
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[0.88rem] font-semibold text-text-primary truncate mb-1">
          {percorso.title}
        </div>
        <div className="flex items-center gap-3 text-[0.72rem] text-text-muted mb-1.5">
          <span>{percorso.completedSteps}/{percorso.stepCount} passi</span>
          {percorso.estimatedHours && (
            <>
              <span className="opacity-30">·</span>
              <span>~{percorso.estimatedHours}h</span>
            </>
          )}
          {percorso.isCompleted && (
            <span className="text-accent-emerald font-semibold">✓ Completato</span>
          )}
        </div>
        <ProgressBar
          percentage={pct}
          color={percorso.isCompleted ? 'emerald' : 'cyan'}
          className="h-1"
        />
      </div>

      {/* CTA */}
      <Link
        href={`/learning-paths/${percorso.slug}`}
        className="shrink-0 px-4 py-1.5 text-[0.75rem] font-semibold rounded-lg bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors"
      >
        {percorso.isCompleted ? 'Rivedi' : 'Continua'}
      </Link>
    </div>
  );
}

/* ── Empty state ── */

function EmptyState({ icon, text, href, cta }: {
  icon: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-5 rounded-xl border border-dashed border-border-subtle text-center justify-center">
      <span className="text-xl opacity-40">{icon}</span>
      <span className="text-[0.78rem] text-text-muted">{text}</span>
      <Link
        href={href}
        className="text-[0.75rem] font-semibold text-accent-cyan hover:text-accent-cyan/80 transition-colors"
      >
        {cta} →
      </Link>
    </div>
  );
}

/* ── Main component ── */

interface AcquistatiTabProps {
  corsi: LibreriaCorso[];
  risorse: LibreriaRisorsa[];
  percorsi: LibreriaPercorso[];
}

export function AcquistatiTab({ corsi, risorse, percorsi }: AcquistatiTabProps) {
  const hasAnything = corsi.length > 0 || risorse.length > 0 || percorsi.length > 0;

  if (!hasAnything) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border-subtle flex items-center justify-center mb-5 text-2xl">
          🛒
        </div>
        <h2 className="font-heading text-[1rem] font-bold text-text-primary mb-2">
          Nessun acquisto ancora
        </h2>
        <p className="text-[0.82rem] text-text-secondary max-w-sm leading-relaxed mb-6">
          I corsi, le risorse e i percorsi che acquisti appariranno qui.
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
      {/* Corsi */}
      <Section title={`Corsi${corsi.length > 0 ? ` · ${corsi.length}` : ''}`}>
        {corsi.length > 0 ? (
          <div className="space-y-2">
            {corsi.map((c) => <CorsoCard key={c.id} corso={c} />)}
          </div>
        ) : (
          <EmptyState
            icon="📚"
            text="Nessun corso acquistato"
            href="/catalogo-corsi"
            cta="Esplora il catalogo"
          />
        )}
      </Section>

      {/* Risorse */}
      <Section title={`Risorse${risorse.length > 0 ? ` · ${risorse.length}` : ''}`}>
        {risorse.length > 0 ? (
          <div className="space-y-2">
            {risorse.map((r) => <RisorsaCard key={r.id} risorsa={r} />)}
          </div>
        ) : (
          <EmptyState
            icon="📄"
            text="Nessuna risorsa acquistata"
            href="/risorse"
            cta="Esplora le risorse"
          />
        )}
      </Section>

      {/* Percorsi */}
      <Section title={`Percorsi${percorsi.length > 0 ? ` · ${percorsi.length}` : ''}`}>
        {percorsi.length > 0 ? (
          <div className="space-y-2">
            {percorsi.map((p) => <PercorsoCard key={p.id} percorso={p} />)}
          </div>
        ) : (
          <EmptyState
            icon="🗺️"
            text="Nessun percorso iniziato"
            href="/learning-paths"
            cta="Esplora i percorsi"
          />
        )}
      </Section>
    </div>
  );
}
