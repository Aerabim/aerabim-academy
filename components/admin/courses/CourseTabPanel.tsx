'use client';

import { useCourseTabsContext } from './CourseNavTabs';

interface CourseTabPanelProps {
  id: string;
  children: React.ReactNode;
}

export function CourseTabPanel({ id, children }: CourseTabPanelProps) {
  const { activeTab } = useCourseTabsContext();
  // Keep all panels in the DOM to preserve client-component state (forms,
  // module managers, etc.) — only toggle visibility via CSS.
  return (
    <div className={activeTab === id ? 'pt-8' : 'hidden'}>
      {children}
    </div>
  );
}
