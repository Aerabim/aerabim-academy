'use client';

import { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

// ─── Shared context ──────────────────────────────────────────────────────────

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  isDirty: boolean;
  setIsDirty: (v: boolean) => void;
  isSaving: boolean;
  setIsSaving: (v: boolean) => void;
}

const LearningPathTabsContext = createContext<TabsContextValue>({
  activeTab: '',
  setActiveTab: () => {},
  isDirty: false,
  setIsDirty: () => {},
  isSaving: false,
  setIsSaving: () => {},
});

export function LearningPathTabsProvider({
  defaultTab,
  children,
}: {
  defaultTab: string;
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  return (
    <LearningPathTabsContext.Provider value={{ activeTab, setActiveTab, isDirty, setIsDirty, isSaving, setIsSaving }}>
      {children}
    </LearningPathTabsContext.Provider>
  );
}

export function useLearningPathTabsContext() {
  return useContext(LearningPathTabsContext);
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

export interface LearningPathNavTab {
  id: string;
  label: string;
}

const UNSAVED_WARNING = 'Hai modifiche non salvate nel form "Dettagli". Se cambi scheda le perderai. Continuare?';

export function LearningPathNavTabs({ tabs }: { tabs: LearningPathNavTab[] }) {
  const { activeTab, setActiveTab, isDirty } = useContext(LearningPathTabsContext);

  function handleClick(id: string) {
    if (id === activeTab) return;
    if (isDirty && !window.confirm(UNSAVED_WARNING)) return;
    setActiveTab(id);
  }

  return (
    <div className="sticky top-0 z-20 -mx-6 lg:-mx-10 border-b border-border-subtle bg-surface-0/95 backdrop-blur-sm">
      <div className="flex items-center overflow-x-auto scrollbar-none px-6 lg:px-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleClick(tab.id)}
            className={cn(
              'px-3 py-2.5 text-[0.78rem] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-accent-cyan text-accent-cyan'
                : 'border-transparent text-text-muted hover:text-text-secondary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
