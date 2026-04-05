'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AcquistatiTab } from './AcquistatiTab';
import { InclusiTab } from './InclusiTab';
import type { LibreriaData } from './types';

type Tab = 'acquistati' | 'inclusi';

interface LibreriaTabsProps {
  data: LibreriaData;
}

export function LibreriaTabs({ data }: LibreriaTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>(
    data.hasActivePlan ? 'inclusi' : 'acquistati',
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: 'acquistati', label: 'Acquistati' },
    { id: 'inclusi',    label: 'Inclusi nel piano' },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-border-subtle pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-[0.82rem] font-semibold rounded-t-md transition-colors relative',
              activeTab === tab.id
                ? 'text-accent-cyan after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-accent-cyan after:rounded-full'
                : 'text-text-muted hover:text-text-secondary hover:bg-surface-2',
            )}
          >
            {tab.label}
            {tab.id === 'acquistati' && data.acquistatiCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[0.65rem] bg-surface-3 text-text-muted font-medium">
                {data.acquistatiCount}
              </span>
            )}
            {tab.id === 'inclusi' && data.hasActivePlan && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[0.65rem] bg-accent-cyan/10 text-accent-cyan font-semibold border border-accent-cyan/20">
                PRO
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'acquistati' && (
        <AcquistatiTab
          corsi={data.corsi}
          risorse={data.risorse}
          percorsi={data.percorsi}
        />
      )}

      {activeTab === 'inclusi' && (
        data.hasActivePlan && data.planInfo ? (
          <InclusiTab
            planInfo={data.planInfo}
            corsi={data.inclusiCorsi}
            percorsi={data.percorsi}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border-subtle flex items-center justify-center mb-5 text-2xl">
              ⭐
            </div>
            <h2 className="font-heading text-[1rem] font-bold text-text-primary mb-2">
              Nessun piano attivo
            </h2>
            <p className="text-[0.82rem] text-text-secondary max-w-sm leading-relaxed mb-6">
              Attiva un piano PRO per accedere a tutti i corsi e percorsi inclusi nell&apos;abbonamento.
            </p>
            <a
              href="/#piani"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[0.82rem] font-semibold rounded-lg bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/20 transition-colors"
            >
              Scopri i piani →
            </a>
          </div>
        )
      )}
    </div>
  );
}
