'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { DashboardUser } from '@/types';

interface DashboardShellProps {
  user: DashboardUser;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-0 flex">
      <Sidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          fullName={user.fullName}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />

        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>

      {/* AI Tutor FAB */}
      <button
        className="fixed bottom-[26px] right-[26px] w-14 h-14 rounded-full bg-gradient-to-br from-accent-cyan to-[#2FB5AD] border-none flex items-center justify-center shadow-[0_4px_24px_rgba(78,205,196,0.3)] hover:scale-[1.08] hover:shadow-[0_6px_32px_rgba(78,205,196,0.4)] transition-all z-50"
        title="AI Tutor"
        aria-label="Apri AI Tutor"
      >
        <svg width="24" height="24" fill="none" stroke="#040B11" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        <span className="absolute inset-[-4px] rounded-full border-2 border-accent-cyan animate-pulseRing" />
      </button>
    </div>
  );
}
