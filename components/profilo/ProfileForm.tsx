'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

interface ProfileData {
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  company: string;
  jobRole: string;
}

export function ProfileForm({ initialData }: { initialData: ProfileData }) {
  const [firstName, setFirstName] = useState(initialData.firstName);
  const [lastName, setLastName] = useState(initialData.lastName);
  const [company, setCompany] = useState(initialData.company);
  const [jobRole, setJobRole] = useState(initialData.jobRole);
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setProfileMsg(null);

    try {
      const supabase = createBrowserClient();
      const fullName = `${firstName} ${lastName}`.trim();

      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          company,
          job_role: jobRole,
        },
      });

      if (error) {
        setProfileMsg({ type: 'error', text: error.message });
      } else {
        setProfileMsg({ type: 'success', text: 'Profilo aggiornato con successo.' });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Errore di connessione. Riprova.' });
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);

    if (newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'La password deve contenere almeno 6 caratteri.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'Le password non coincidono.' });
      return;
    }

    setChangingPw(true);

    try {
      const supabase = createBrowserClient();

      // Re-authenticate with current password to verify identity
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: initialData.email,
        password: currentPassword,
      });

      if (signInError) {
        setPwMsg({ type: 'error', text: 'Password attuale non corretta.' });
        setChangingPw(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setPwMsg({ type: 'error', text: error.message });
      } else {
        setPwMsg({ type: 'success', text: 'Password aggiornata con successo.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPwMsg({ type: 'error', text: 'Errore di connessione. Riprova.' });
    } finally {
      setChangingPw(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-brand-blue/30 bg-brand-dark/50 px-4 py-2.5 text-white placeholder-brand-gray/50 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-colors';

  const labelClass = 'block text-sm font-medium text-brand-light mb-1.5';

  return (
    <div className="space-y-8">
      {/* Personal Info */}
      <div className="rounded-xl border border-brand-blue/20 bg-gradient-to-br from-brand-blue/10 to-brand-dark/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Informazioni personali</h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className={labelClass}>Nome</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
                placeholder="Il tuo nome"
              />
            </div>
            <div>
              <label htmlFor="lastName" className={labelClass}>Cognome</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
                placeholder="Il tuo cognome"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input
              id="email"
              type="email"
              value={initialData.email}
              disabled
              className={`${inputClass} opacity-50 cursor-not-allowed`}
            />
            <p className="mt-1 text-xs text-brand-gray">
              Per modificare l&apos;email contatta il supporto.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="company" className={labelClass}>Azienda / Ente</label>
              <input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={inputClass}
                placeholder="Nome azienda o ente"
              />
            </div>
            <div>
              <label htmlFor="jobRole" className={labelClass}>Ruolo professionale</label>
              <input
                id="jobRole"
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className={inputClass}
                placeholder="es. BIM Manager, Ingegnere"
              />
            </div>
          </div>

          {profileMsg && (
            <p className={`text-sm ${profileMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {profileMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-cyan-500/20 px-6 py-2.5 text-sm font-medium text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="rounded-xl border border-brand-blue/20 bg-gradient-to-br from-brand-blue/10 to-brand-dark/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Cambia password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="currentPassword" className={labelClass}>Password attuale</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className={labelClass}>Nuova password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className={labelClass}>Conferma nuova password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {pwMsg && (
            <p className={`text-sm ${pwMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {pwMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={changingPw}
            className="rounded-lg bg-cyan-500/20 px-6 py-2.5 text-sm font-medium text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {changingPw ? 'Aggiornamento...' : 'Aggiorna password'}
          </button>
        </form>
      </div>
    </div>
  );
}
