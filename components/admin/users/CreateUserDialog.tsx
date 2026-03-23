'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole, UserPlan } from '@/types';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'student', label: 'Membro (student)' },
  { value: 'docente', label: 'Docente' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'moderatore', label: 'Moderatore' },
  { value: 'admin', label: 'Admin' },
];

const PLAN_OPTIONS: { value: UserPlan; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'team', label: 'Team' },
  { value: 'pa', label: 'PA' },
];

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateUserDialog({ open, onClose, onCreated }: CreateUserDialogProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [plan, setPlan] = useState<UserPlan>('free');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  function resetForm() {
    setEmail('');
    setFullName('');
    setPassword('');
    setRole('student');
    setPlan('free');
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !fullName || !password) {
      setError('Tutti i campi sono obbligatori.');
      return;
    }

    if (password.length < 6) {
      setError('La password deve avere almeno 6 caratteri.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, password, role, plan }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Errore durante la creazione.');
        return;
      }

      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      console.error('Create user error:', err);
      setError('Errore di rete.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-surface-1 border border-border-subtle rounded-lg shadow-xl w-full max-w-md mx-4 animate-fadeIn">
        <div className="px-5 py-4 border-b border-border-subtle">
          <h2 className="text-[1rem] font-heading font-bold text-text-primary">Nuovo Utente</h2>
          <p className="text-[0.78rem] text-text-muted mt-0.5">Crea un nuovo account sulla piattaforma.</p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-accent-rose/10 border border-accent-rose/20 rounded-md text-[0.78rem] text-accent-rose">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[0.72rem] font-heading font-bold uppercase tracking-wider text-text-muted">
              Nome completo *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Mario Rossi"
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-md text-[0.82rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[0.72rem] font-heading font-bold uppercase tracking-wider text-text-muted">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mario@esempio.it"
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-md text-[0.82rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[0.72rem] font-heading font-bold uppercase tracking-wider text-text-muted">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caratteri"
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-md text-[0.82rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
            />
          </div>

          {/* Role & Plan side by side */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-[0.72rem] font-heading font-bold uppercase tracking-wider text-text-muted">
                Ruolo
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-md text-[0.82rem] text-text-primary focus:outline-none focus:border-accent-cyan/50"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[0.72rem] font-heading font-bold uppercase tracking-wider text-text-muted">
                Piano
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as UserPlan)}
                className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-md text-[0.82rem] text-text-primary focus:outline-none focus:border-accent-cyan/50"
              >
                {PLAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { resetForm(); onClose(); }}
              className="px-4 py-2 text-[0.82rem] text-text-secondary hover:text-text-primary transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-accent-cyan text-brand-dark text-[0.82rem] font-semibold rounded-md hover:bg-accent-cyan/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Creazione...' : 'Crea utente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
