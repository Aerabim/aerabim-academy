'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { UserTable } from './UserTable';
import { EnrollmentTable } from './EnrollmentTable';

const TABS = [
  { key: 'utenti', label: 'Utenti' },
  { key: 'iscrizioni', label: 'Tutte le iscrizioni' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function UsersTabView() {
  const [activeTab, setActiveTab] = useState<TabKey>('utenti');

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border-subtle">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2.5 text-[0.82rem] font-medium transition-colors relative',
              activeTab === tab.key
                ? 'text-accent-amber'
                : 'text-text-muted hover:text-text-primary',
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-amber rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'utenti' && <UserTable />}
      {activeTab === 'iscrizioni' && <EnrollmentTable />}
    </div>
  );
}
