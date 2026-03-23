'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { timeAgo } from '@/lib/utils';

interface UserData {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'admin';
  plan: 'free' | 'pro' | 'team' | 'pa';
  createdAt: string;
}

interface EnrollmentData {
  id: string;
  courseId: string;
  courseTitle: string;
  accessType: string;
  expiresAt: string | null;
  createdAt: string;
}

interface CertificateData {
  id: string;
  courseTitle: string;
  certificateNumber: string;
  issuedAt: string;
}

interface UserDetailProps {
  user: UserData;
  enrollments: EnrollmentData[];
  certificates: CertificateData[];
}

export function UserDetail({ user, enrollments: initialEnrollments, certificates }: UserDetailProps) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [enrollments, setEnrollments] = useState(initialEnrollments);
  const [changingRole, setChangingRole] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<EnrollmentData | null>(null);
  const [revoking, setRevoking] = useState(false);

  async function handleRoleChange(newRole: 'student' | 'admin') {
    setChangingRole(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setRole(newRole);
      }
    } catch (err) {
      console.error('Change role error:', err);
    } finally {
      setChangingRole(false);
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/admin/enrollments/${revokeTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revoke: true }),
      });
      if (res.ok) {
        setEnrollments((prev) =>
          prev.map((e) =>
            e.id === revokeTarget.id
              ? { ...e, expiresAt: new Date().toISOString() }
              : e,
          ),
        );
      }
    } catch (err) {
      console.error('Revoke enrollment error:', err);
    } finally {
      setRevoking(false);
      setRevokeTarget(null);
    }
  }

  function isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  return (
    <div className="space-y-8">
      {/* Role management */}
      <section className="bg-surface-1 border border-border-subtle rounded-lg p-5">
        <h3 className="text-[0.9rem] font-heading font-semibold text-text-primary mb-3">Ruolo</h3>
        <div className="flex items-center gap-3">
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value as 'student' | 'admin')}
            disabled={changingRole}
            className="px-3 py-2 bg-surface-2 border border-border-subtle rounded-md text-[0.82rem] text-text-primary focus:outline-none focus:border-accent-cyan/50"
          >
            <option value="student">Membro (student)</option>
            <option value="admin">Admin</option>
          </select>
          {changingRole && <span className="text-[0.78rem] text-text-muted">Aggiornamento...</span>}
        </div>
      </section>

      {/* Enrollments */}
      <section className="bg-surface-1 border border-border-subtle rounded-lg p-5">
        <h3 className="text-[0.9rem] font-heading font-semibold text-text-primary mb-3">
          Iscrizioni ({enrollments.length})
        </h3>
        {enrollments.length === 0 ? (
          <p className="text-[0.82rem] text-text-muted">Nessuna iscrizione.</p>
        ) : (
          <div className="space-y-2">
            {enrollments.map((e) => {
              const expired = isExpired(e.expiresAt);
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 px-3 py-2 bg-surface-2/30 rounded-md"
                >
                  <span className="text-[0.82rem] text-text-primary flex-1">{e.courseTitle}</span>
                  <Badge variant={e.accessType === 'pro_subscription' ? 'cyan' : e.accessType === 'free' ? 'emerald' : 'amber'}>
                    {e.accessType}
                  </Badge>
                  {expired ? (
                    <span className="text-[0.72rem] text-accent-rose font-medium">Scaduto</span>
                  ) : e.expiresAt ? (
                    <span className="text-[0.72rem] text-text-muted">Scade: {new Date(e.expiresAt).toLocaleDateString('it-IT')}</span>
                  ) : (
                    <span className="text-[0.72rem] text-accent-emerald font-medium">Attivo</span>
                  )}
                  {!expired && (
                    <button
                      onClick={() => setRevokeTarget(e)}
                      className="text-[0.72rem] text-accent-rose hover:underline"
                    >
                      Revoca
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Certificates */}
      <section className="bg-surface-1 border border-border-subtle rounded-lg p-5">
        <h3 className="text-[0.9rem] font-heading font-semibold text-text-primary mb-3">
          Certificati ({certificates.length})
        </h3>
        {certificates.length === 0 ? (
          <p className="text-[0.82rem] text-text-muted">Nessun certificato.</p>
        ) : (
          <div className="space-y-2">
            {certificates.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-2 bg-surface-2/30 rounded-md">
                <span className="text-[0.82rem] text-text-primary flex-1">{c.courseTitle}</span>
                <span className="text-[0.72rem] text-text-muted font-mono">{c.certificateNumber}</span>
                <span className="text-[0.72rem] text-text-muted">{timeAgo(c.issuedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!revokeTarget}
        title="Revoca accesso"
        message={`Revocare l'accesso di ${user.fullName} al corso "${revokeTarget?.courseTitle}"?`}
        confirmLabel="Revoca"
        variant="danger"
        loading={revoking}
        onConfirm={handleRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  );
}
