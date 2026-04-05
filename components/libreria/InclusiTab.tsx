import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AREA_CONFIG, LEVEL_LABELS } from '@/lib/area-config';
import type { LibreriaCorso, LibreriaPercorso, PlanInfo } from './types';

/* ── Plan labels ── */

const PLAN_LABELS: Record<string, string> = {
  pro:  'PRO',
  team: 'Team',
  pa:   'PA',
};

/* ── Plan info banner ── */

function PlanBanner({ planInfo }: { planInfo: PlanInfo }) {
  const label = PLAN_LABELS[planInfo.plan] ?? planInfo.plan.toUpperCase();
  const isPastDue = planInfo.status === 'past_due';
  const renewalDate = planInfo.currentPeriodEnd
    ? new Date(planInfo.currentPeriodEnd).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className={cn(
      'flex items-center gap-4 p-5 rounded-xl border',
      isPastDue
        ? 'bg-accent-amber/5 border-accent-amber/20'
        : 'bg-accent-cyan/5 border-accent-cyan/20',
    )}>
      {/* Plan badge */}
      <div className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-[0.7rem] font-black tracking-wider',
        isPastDue
          ? 'bg-accent-amber/15 text-accent-amber border border-accent-amber/30'
          : 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30',
      )}>
        {label}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[0.88rem] font-bold text-text-primary">
          Piano {label}
          {isPastDue && (
            <span className="ml-2 text-[0.65rem] px-1.5 py-0.5 rounded bg-accent-amber/10 text-accent-amber border border-accent-amber/20 font-semibold align-middle">
              Pagamento in sospeso
            </span>
          )}
        </div>
        <div className="text-[0.75rem] text-text-muted mt-0.5">
          {isPastDue
            ? 'Aggiorna il metodo di pagamento per mantenere l\'accesso ai contenuti.'
            : renewalDate
              ? `Rinnovo il ${renewalDate}`
              : 'Abbonamento attivo'}
        </div>
      </div>

      {/* CTA */}
      {isPastDue ? (
        <Link
          href="/impostazioni/abbonamento"
          className="shrink-0 px-4 py-1.5 text-[0.75rem] font-semibold rounded-lg bg-accent-amber/15 text-accent-amber hover:bg-accent-amber/25 border border-accent-amber/20 transition-colors"
        >
          Aggiorna
        </Link>
      ) : (
        <Link
          href="/impostazioni/abbonamento"
          className="shrink-0 px-4 py-1.5 text-[0.75rem] font-semibold rounded-lg bg-surface-2 text-text-muted hover:bg-surface-3 border border-border-subtle transition-colors"
        >
          Gestisci
        </Link>
      )}
    </div>
  );
}

/* ── Corso card (incluso) ── */

function CorsoInclusiCard({ corso }: { corso: LibreriaCorso }) {
  const area = AREA_CONFIG[corso.area];

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border-subtle bg-surface-1 hover:bg-surface-2 hover:border-border-hover transition-colors">
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
          <span className="text-[0.62rem] px-1.5 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 font-semibold">
            Incluso
          </span>
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
      <Link
        href={`/learn/${corso.id}`}
        className="shrink-0 px-4 py-1.5 text-[0.75rem] font-semibold rounded-lg bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors"
      >
        Vai al corso
      </Link>
    </div>
  );
}

/* ── Percorso card (incluso) ── */

function PercorsoInclusiCard({ percorso }: { percorso: LibreriaPercorso }) {
  const pct = percorso.stepCount > 0
    ? Math.round((percorso.completedSteps / percorso.stepCount) * 100)
    : 0;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border-subtle bg-surface-1 hover:bg-surface-2 hover:border-border-hover transition-colors">
      <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden bg-surface-3 flex items-center justify-center text-2xl">
        {percorso.thumbnailUrl ? (
          <img src={percorso.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          percorso.isCompleted ? '✅' : '🗺️'
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[0.88rem] font-semibold text-text-primary truncate">
            {percorso.title}
          </span>
          <span className="shrink-0 text-[0.62rem] px-1.5 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 font-semibold">
            Incluso
          </span>
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

      <Link
        href={`/learning-paths/${percorso.slug}`}
        className="shrink-0 px-4 py-1.5 text-[0.75rem] font-semibold rounded-lg bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors"
      >
        {percorso.isCompleted ? 'Rivedi' : 'Continua'}
      </Link>
    </div>
  );
}

/* ── Discover CTA ── */

function DiscoverCta({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-dashed border-accent-cyan/30 text-[0.78rem] font-semibold text-accent-cyan hover:bg-accent-cyan/5 hover:border-accent-cyan/50 transition-colors"
    >
      {label} →
    </Link>
  );
}

/* ── Main component ── */

interface InclusiTabProps {
  planInfo: PlanInfo;
  corsi: LibreriaCorso[];
  percorsi: LibreriaPercorso[];
}

export function InclusiTab({ planInfo, corsi, percorsi }: InclusiTabProps) {
  return (
    <div className="space-y-8">
      {/* Plan info */}
      <PlanBanner planInfo={planInfo} />

      {/* Corsi inclusi */}
      <div className="space-y-3">
        <h2 className="text-[0.78rem] font-semibold text-text-muted uppercase tracking-wider">
          Corsi{corsi.length > 0 ? ` · ${corsi.length} iniziati` : ''}
        </h2>
        {corsi.length > 0 ? (
          <div className="space-y-2">
            {corsi.map((c) => <CorsoInclusiCard key={c.id} corso={c} />)}
          </div>
        ) : (
          <div className="flex items-center gap-4 px-4 py-5 rounded-xl border border-dashed border-border-subtle">
            <span className="text-xl opacity-40">📚</span>
            <span className="text-[0.78rem] text-text-muted flex-1">
              Con il tuo piano hai accesso a tutti i corsi del catalogo.
            </span>
          </div>
        )}
        <DiscoverCta href="/catalogo-corsi" label="Esplora tutti i corsi inclusi" />
      </div>

      {/* Percorsi inclusi */}
      <div className="space-y-3">
        <h2 className="text-[0.78rem] font-semibold text-text-muted uppercase tracking-wider">
          Percorsi{percorsi.length > 0 ? ` · ${percorsi.length} iniziati` : ''}
        </h2>
        {percorsi.length > 0 ? (
          <div className="space-y-2">
            {percorsi.map((p) => <PercorsoInclusiCard key={p.id} percorso={p} />)}
          </div>
        ) : (
          <div className="flex items-center gap-4 px-4 py-5 rounded-xl border border-dashed border-border-subtle">
            <span className="text-xl opacity-40">🗺️</span>
            <span className="text-[0.78rem] text-text-muted flex-1">
              Con il tuo piano hai accesso a tutti i percorsi di apprendimento.
            </span>
          </div>
        )}
        <DiscoverCta href="/learning-paths" label="Esplora tutti i percorsi inclusi" />
      </div>
    </div>
  );
}
