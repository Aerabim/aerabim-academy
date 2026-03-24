'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { SearchProvider, useSearch } from '@/lib/search-context';
import type { DashboardUser } from '@/types';

interface DashboardShellProps {
  user: DashboardUser;
  courseCount: number;
  children: React.ReactNode;
}

export function DashboardShell({ user, courseCount, children }: DashboardShellProps) {
  return (
    <SearchProvider>
      <DashboardShellInner user={user} courseCount={courseCount}>
        {children}
      </DashboardShellInner>
    </SearchProvider>
  );
}

function DashboardShellInner({ user, courseCount, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { query, setQuery } = useSearch();

  return (
    <div className="h-screen bg-surface-0 flex overflow-hidden">
      <Sidebar
        user={user}
        courseCount={courseCount}
        open={sidebarOpen}
        collapsed={collapsed}
        onClose={() => setSidebarOpen(false)}
        onCollapseToggle={() => setCollapsed((c) => !c)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuToggle={() => setSidebarOpen((o) => !o)}
          onSearch={setQuery}
          searchQuery={query}
        />

        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
        <Footer />
      </div>

      {/* AI Tutor FAB */}
      <Link
        href="/ai-tutor"
        title="AI Tutor"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-accent-cyan text-brand-dark flex items-center justify-center shadow-lg hover:bg-accent-cyan/90 hover:scale-105 transition-all"
      >
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path d="M12 2a4 4 0 014 4c0 1.95-1.4 3.58-3.25 3.93" />
          <path d="M8.24 9.93A4 4 0 0112 2" />
          <path d="M12 15v7" />
          <path d="M8 18h8" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </Link>
    </div>
  );
}
