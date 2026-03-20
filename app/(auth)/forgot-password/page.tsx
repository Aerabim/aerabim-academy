"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <>
        <div className="auth-success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" width="32" height="32">
            <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" />
          </svg>
        </div>
        <h1 className="auth-title">Email inviata</h1>
        <p className="auth-subtitle">
          Se l&apos;indirizzo <strong style={{ color: "var(--accent)" }}>{email}</strong> è associato a un account,
          riceverai un link per reimpostare la password.
        </p>
        <Link href="/login" className="auth-btn" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 16 }}>
          Torna al login
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="auth-title">Recupera password</h1>
      <p className="auth-subtitle">
        Inserisci la tua email e ti invieremo un link per reimpostare la password
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
              autoFocus
            />
          </div>
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? <div className="auth-spinner" /> : "Invia link di recupero"}
        </button>
      </form>

      <div className="auth-divider">
        <span>Ricordi la password?</span>
      </div>

      <Link href="/login" className="auth-btn-outline">
        Torna al login
      </Link>
    </>
  );
}
