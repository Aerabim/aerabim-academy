"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [referral, setReferral] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const supabase = createBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPw) {
      setError("Le password non coincidono.");
      return;
    }
    if (password.length < 6) {
      setError("La password deve essere di almeno 6 caratteri.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role,
          company: company.trim(),
          referral,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        setError("Questa email è già registrata. Prova ad accedere.");
      } else {
        setError(error.message);
      }
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <>
        <div className="auth-success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" width="32" height="32">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <h1 className="auth-title">Controlla la tua email</h1>
        <p className="auth-subtitle">
          Abbiamo inviato un link di conferma a <strong style={{ color: "var(--accent)" }}>{email}</strong>.
          Clicca sul link per attivare il tuo account.
        </p>
        <Link href="/login" className="auth-btn" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 16 }}>
          Torna al login
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="auth-title">Crea un account</h1>
      <p className="auth-subtitle">
        Registrati per accedere ai corsi AerACADEMY
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        {error && (
          <div className="auth-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="fullName">Nome e Cognome</label>
          <div className="auth-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Mario Rossi"
              required
              autoComplete="name"
              autoFocus
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="role">Ruolo professionale</label>
          <div className="auth-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)} required className="auth-select">
              <option value="" disabled>Seleziona ruolo</option>
              <option>RUP</option>
              <option>Funzionario tecnico</option>
              <option>CEO</option>
              <option>CFO</option>
              <option>CTO</option>
              <option>Direttore Tecnico</option>
              <option>Direttore Commerciale</option>
              <option>Project Manager</option>
              <option>BIM Manager</option>
              <option>CDE Manager</option>
              <option>BIM Coordinator</option>
              <option>BIM Specialist</option>
              <option>Freelance</option>
              <option>Studente</option>
              <option>Altro</option>
            </select>
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="company">Azienda o Ente</label>
          <div className="auth-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /><line x1="9" y1="9" x2="9" y2="9.01" /><line x1="9" y1="13" x2="9" y2="13.01" /><line x1="9" y1="17" x2="9" y2="17.01" />
            </svg>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Nome azienda o ente pubblico"
              required
              autoComplete="organization"
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="referral">Come ci hai conosciuto?</label>
          <div className="auth-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <select id="referral" value={referral} onChange={(e) => setReferral(e.target.value)} required className="auth-select">
              <option value="" disabled>Seleziona</option>
              <option>LinkedIn</option>
              <option>Instagram</option>
              <option>Facebook</option>
              <option>Webinar</option>
              <option>Evento/Fiera</option>
              <option>Università</option>
              <option>AI</option>
              <option>Google</option>
              <option>Newsletter</option>
              <option>Altro</option>
            </select>
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <div className="auth-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" />
            </svg>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@azienda.it"
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <div className="auth-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caratteri"
              required
              autoComplete="new-password"
              minLength={6}
            />
            <button
              type="button"
              className="auth-toggle-pw"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="confirmPw">Conferma Password</label>
          <div className="auth-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M9 12l2 2 4-4" /><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="confirmPw"
              type={showPassword ? "text" : "password"}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Ripeti la password"
              required
              autoComplete="new-password"
              minLength={6}
            />
          </div>
        </div>

        <label className="auth-terms">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
          />
          <span>
            Accetto i{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer">
              Termini e Condizioni
            </a>{" "}
            e la{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
          </span>
        </label>

        <button type="submit" className="auth-btn" disabled={loading || !acceptedTerms}>
          {loading ? <div className="auth-spinner" /> : "Registrati"}
        </button>
      </form>

      <div className="auth-divider">
        <span>Hai già un account?</span>
      </div>

      <Link href="/login" className="auth-btn-outline">
        Accedi
      </Link>
    </>
  );
}
