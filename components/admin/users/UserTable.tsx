'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { CreateUserDialog } from './CreateUserDialog';
import type { AdminUserListItem, UserRole, UserPlan } from '@/types';

const ROLE_BADGES: Record<UserRole, { label: string; variant: 'cyan' | 'amber' | 'emerald' | 'violet' | 'rose' }> = {
  student: { label: 'Membro', variant: 'violet' },
  docente: { label: 'Docente', variant: 'cyan' },
  tutor: { label: 'Tutor', variant: 'emerald' },
  moderatore: { label: 'Moderatore', variant: 'rose' },
  admin: { label: 'Admin', variant: 'amber' },
};

const PLAN_BADGES: Record<UserPlan, { label: string; variant: 'cyan' | 'amber' | 'emerald' | 'violet' }> = {
  free: { label: 'Free', variant: 'violet' },
  pro: { label: 'Pro', variant: 'cyan' },
  team: { label: 'Team', variant: 'amber' },
  pa: { label: 'PA', variant: 'emerald' },
};

export function UserTable() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users ?? []);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search + Create */}
      <div className="flex items-center gap-3 flex-wrap">
      <div className="relative max-w-xs flex-1 min-w-[200px]">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per nome o email..."
          className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-border-subtle rounded-md text-[0.78rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20 transition-all"
        />
      </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-cyan text-brand-dark text-[0.82rem] font-semibold rounded-md hover:bg-accent-cyan/90 transition-colors"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Nuovo utente
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-border-subtle rounded-lg">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-2/50">
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Utente</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Ruolo</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Piano</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Iscrizioni</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[0.82rem] text-text-muted">
                  Caricamento...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[0.82rem] text-text-muted">
                  Nessun utente trovato.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const planBadge = PLAN_BADGES[user.plan] ?? PLAN_BADGES.free;
                return (
                  <tr key={user.id} className="border-b border-border-subtle last:border-b-0 hover:bg-surface-2/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-[0.82rem] font-medium text-text-primary">{user.fullName}</div>
                      <div className="text-[0.7rem] text-text-muted">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={(ROLE_BADGES[user.role] ?? ROLE_BADGES.student).variant}>
                        {(ROLE_BADGES[user.role] ?? ROLE_BADGES.student).label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={planBadge.variant}>{planBadge.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] text-text-secondary">
                      {user.enrollmentCount}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/utenti/${user.id}`}
                        className="text-[0.78rem] text-accent-cyan hover:underline"
                      >
                        Dettaglio
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <CreateUserDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchUsers}
      />
    </div>
  );
}
