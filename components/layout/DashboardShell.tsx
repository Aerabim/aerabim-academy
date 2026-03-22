'use client';

import { useState } from 'react';
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
    </div>
  );
}
