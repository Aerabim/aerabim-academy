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

const CourseTabsContext = createContext<TabsContextValue>({
  activeTab: '',
  setActiveTab: () => {},
  isDirty: false,
  setIsDirty: () => {},
  isSaving: false,
  setIsSaving: () => {},
});

export function CourseTabsProvider({
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
    <CourseTabsContext.Provider value={{ activeTab, setActiveTab, isDirty, setIsDirty, isSaving, setIsSaving }}>
      {children}
    </CourseTabsContext.Provider>
  );
}

export function useCourseTabsContext() {
  return useContext(CourseTabsContext);
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

export interface CourseNavTab {
  id: string;
  label: string;
}

const UNSAVED_WARNING = 'Hai modifiche non salvate nel form "Dettagli". Se cambi scheda le perderai. Continuare?';

export function CourseNavTabs({ tabs }: { tabs: CourseNavTab[] }) {
  const { activeTab, setActiveTab, isDirty } = useContext(CourseTabsContext);

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
