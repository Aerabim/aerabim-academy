'use client';

import { useLearningPathTabsContext } from './LearningPathNavTabs';

interface LearningPathTabPanelProps {
  id: string;
  children: React.ReactNode;
}

export function LearningPathTabPanel({ id, children }: LearningPathTabPanelProps) {
  const { activeTab } = useLearningPathTabsContext();
  // Keep all panels in the DOM to preserve client-component state (forms, step lists, etc.)
  return (
    <div className={activeTab === id ? 'pt-8' : 'hidden'}>
      {children}
    </div>
  );
}
