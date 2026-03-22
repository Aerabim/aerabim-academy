import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { AREA_CONFIG } from '@/lib/area-config';
import type { AreaCode } from '@/types';

interface CertificateWithCourse {
  id: string;
  verify_code: string;
  issued_at: string;
  courses: {
    title: string;
    area: AreaCode;
  };
}

export default async function CertificatiPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch certificates with course info
  const { data: rawCerts } = await supabase
    .from('certificates')
    .select('id, verify_code, issued_at, courses(title, area)')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false });

  const certificates = (rawCerts ?? []) as unknown as CertificateWithCourse[];

  return (
    <div className="w-full px-6 lg:px-9 py-7">
      {/* Header */}
      <h1 className="font-heading text-2xl font-bold text-text-primary">
        I Miei <span className="gradient-text-cyan">Certificati</span>
      </h1>
      <p className="mt-2 text-text-secondary text-sm">
        {certificates.length === 0
          ? 'Nessun certificato ottenuto. Completa un corso per ricevere il tuo certificato!'
          : `${certificates.length} certificat${certificates.length === 1 ? 'o ottenuto' : 'i ottenuti'}`}
      </p>

      {/* Certificate list */}
      {certificates.length > 0 && (
        <div className="mt-6 space-y-2.5">
          {certificates.map((cert) => {
            const area = AREA_CONFIG[cert.courses.area];
            const issuedDate = new Date(cert.issued_at).toLocaleDateString('it-IT', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <Card key={cert.id} className="flex items-center gap-4 p-4">
                {/* Icon */}
                <div className="w-[52px] h-[52px] rounded-lg shrink-0 flex items-center justify-center bg-accent-cyan/[0.08]">
                  <span className="text-xl">{area?.emoji ?? '📜'}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-[0.88rem] font-semibold text-text-primary truncate">
                    {cert.courses.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-text-muted text-[0.68rem]">
                    <span>{issuedDate}</span>
                    <span className="text-border-hover">·</span>
                    <span className="font-mono tracking-wide">{cert.verify_code}</span>
                  </div>
                </div>

                {/* Download button */}
                <a
                  href={`/api/certificati/${cert.id}`}
                  className="shrink-0 font-heading text-[0.72rem] font-semibold bg-surface-3 text-accent-cyan px-4 py-2 rounded-full hover:bg-surface-4 transition-colors flex items-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2v7.5M4 7l3 3 3-3M3 11.5h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Scarica PDF
                </a>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {certificates.length === 0 && (
        <div className="mt-10 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎓</span>
          </div>
          <p className="text-text-secondary text-sm max-w-sm mx-auto">
            Completa tutte le lezioni e supera i quiz di un corso per ottenere il tuo certificato di completamento.
          </p>
        </div>
      )}
    </div>
  );
}
