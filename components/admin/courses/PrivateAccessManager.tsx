'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface EnrolledUser {
  enrollmentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}

interface SearchUser {
  id: string;
  email: string;
  fullName: string;
}

interface PrivateAccessManagerProps {
  courseId: string;
}

export function PrivateAccessManager({ courseId }: PrivateAccessManagerProps) {
  const [enrolled, setEnrolled] = useState<EnrolledUser[]>([]);
  const [loadingEnrolled, setLoadingEnrolled] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load enrolled users
  const loadEnrolled = useCallback(async () => {
    setLoadingEnrolled(true);
    try {
      const res = await fetch(`/api/admin/enrollments?courseId=${courseId}`);
      if (!res.ok) return;
      const data = await res.json();
      const list = (data.enrollments ?? []) as {
        id: string; userId: string; userName: string; userEmail: string; createdAt: string;
      }[];
      setEnrolled(list.map((e) => ({
        enrollmentId: e.id,
        userId: e.userId,
        userName: e.userName,
        userEmail: e.userEmail,
        createdAt: e.createdAt,
      })));
    } catch {
      // silent
    } finally {
      setLoadingEnrolled(false);
    }
  }, [courseId]);

  useEffect(() => { loadEnrolled(); }, [loadEnrolled]);

  // Search users with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (search.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&perPage=10`);
        if (!res.ok) return;
        const data = await res.json();
        const users = (data.users ?? []) as { id: string; email: string; fullName: string }[];
        setSearchResults(users);
        setShowDropdown(true);
      } catch {
        // silent
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!searchRef.current?.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleAdd(user: SearchUser) {
    setError('');
    if (enrolled.some((e) => e.userId === user.id)) {
      setError('Utente già abilitato per questo corso.');
      setShowDropdown(false);
      setSearch('');
      return;
    }
    setAdding(user.id);
    setShowDropdown(false);
    setSearch('');
    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, courseId, accessType: 'free' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Errore durante l\'aggiunta.');
        return;
      }
      await loadEnrolled();
    } catch {
      setError('Errore di rete.');
    } finally {
      setAdding(null);
    }
  }

  async function handleRemove(enrollmentId: string, userName: string) {
    if (!window.confirm(`Rimuovere l'accesso a "${userName}"? L'utente non potrà più accedere al corso.`)) return;
    setRemoving(enrollmentId);
    try {
      await fetch(`/api/admin/enrollments/${enrollmentId}`, { method: 'DELETE' });
      setEnrolled((prev) => prev.filter((e) => e.enrollmentId !== enrollmentId));
    } catch {
      // silent
    } finally {
      setRemoving(null);
    }
  }

  const enrolledIds = new Set(enrolled.map((e) => e.userId));

  return (
    <div className="bg-surface-1 border border-accent-violet/20 rounded-lg p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded flex items-center justify-center bg-accent-violet/10">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-accent-violet">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h3 className="text-[0.88rem] font-heading font-semibold text-text-primary">
          Accesso privato
        </h3>
        <span className="ml-auto text-[0.72rem] text-text-muted">
          {loadingEnrolled ? '…' : `${enrolled.length} ${enrolled.length === 1 ? 'utente abilitato' : 'utenti abilitati'}`}
        </span>
      </div>

      {/* Search */}
      <div ref={searchRef} className="relative">
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-2 border border-border-subtle rounded-md focus-within:border-accent-violet/40 transition-colors">
          {searching
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="animate-spin text-text-muted shrink-0"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            : <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-text-muted shrink-0"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          }
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca utente per nome o email…"
            className="flex-1 bg-transparent text-[0.82rem] text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          {search && (
            <button onClick={() => { setSearch(''); setShowDropdown(false); }} className="text-text-muted hover:text-text-secondary transition-colors">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-20 top-full mt-1 w-full bg-surface-2 border border-border-subtle rounded-lg shadow-lg py-1 max-h-56 overflow-y-auto">
            {searchResults.map((user) => {
              const alreadyIn = enrolledIds.has(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => !alreadyIn && handleAdd(user)}
                  disabled={alreadyIn || adding === user.id}
                  className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-surface-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-7 h-7 rounded-full bg-accent-violet/10 flex items-center justify-center shrink-0">
                    <span className="text-[0.65rem] font-bold text-accent-violet uppercase">
                      {(user.fullName || user.email).charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.8rem] text-text-primary truncate">{user.fullName || '—'}</div>
                    <div className="text-[0.7rem] text-text-muted truncate">{user.email}</div>
                  </div>
                  {alreadyIn
                    ? <span className="text-[0.68rem] text-accent-emerald shrink-0">già abilitato</span>
                    : <span className="text-[0.68rem] text-accent-violet shrink-0">+ Aggiungi</span>
                  }
                </button>
              );
            })}
          </div>
        )}

        {showDropdown && !searching && searchResults.length === 0 && search.trim().length >= 2 && (
          <div className="absolute z-20 top-full mt-1 w-full bg-surface-2 border border-border-subtle rounded-lg shadow-lg py-3 text-center text-[0.78rem] text-text-muted">
            Nessun utente trovato.
          </div>
        )}
      </div>

      {error && (
        <p className="text-[0.78rem] text-accent-rose">{error}</p>
      )}

      {/* Enrolled list */}
      {loadingEnrolled ? (
        <div className="py-4 text-center text-[0.78rem] text-text-muted">Caricamento…</div>
      ) : enrolled.length === 0 ? (
        <div className="py-4 text-center text-[0.78rem] text-text-muted">
          Nessun utente abilitato. Cerca e aggiungi utenti tramite il campo sopra.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {enrolled.map((e) => (
            <li key={e.enrollmentId} className="flex items-center gap-3 px-3 py-2 rounded-md bg-surface-2 group">
              <div className="w-7 h-7 rounded-full bg-accent-violet/10 flex items-center justify-center shrink-0">
                <span className="text-[0.65rem] font-bold text-accent-violet uppercase">
                  {(e.userName || e.userEmail).charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.8rem] text-text-primary truncate">{e.userName}</div>
                <div className="text-[0.7rem] text-text-muted truncate">{e.userEmail}</div>
              </div>
              <span className="text-[0.68rem] text-text-muted shrink-0 hidden group-hover:block">
                {new Date(e.createdAt).toLocaleDateString('it-IT')}
              </span>
              <button
                onClick={() => handleRemove(e.enrollmentId, e.userName || e.userEmail)}
                disabled={removing === e.enrollmentId}
                title="Rimuovi accesso"
                className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-accent-rose hover:bg-accent-rose/10 transition-colors disabled:opacity-40 shrink-0"
              >
                {removing === e.enrollmentId
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  : <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                }
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
