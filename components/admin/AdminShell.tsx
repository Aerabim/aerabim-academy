'use client';

import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen bg-surface-0 flex overflow-hidden">
      <AdminSidebar
        open={sidebarOpen}
        collapsed={collapsed}
        onClose={() => setSidebarOpen(false)}
        onCollapseToggle={() => setCollapsed((c) => !c)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuToggle={() => setSidebarOpen((o) => !o)} />

        <main
          className="flex-1 overflow-y-auto w-full"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(240,165,0,0.04) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
