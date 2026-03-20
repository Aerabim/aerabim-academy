import { Card } from '@/components/ui/Card';
import { PLACEHOLDER_CERTIFICATES } from '@/lib/placeholder-data';

export default function CertificatiPage() {
  return (
    <div className="w-full px-6 lg:px-9 py-7">
      {/* Header */}
      <h1 className="font-heading text-2xl font-bold text-text-primary">
        I Miei <span className="gradient-text-cyan">Certificati</span>
      </h1>
      <p className="mt-2 text-text-secondary text-sm">
        {PLACEHOLDER_CERTIFICATES.length} certificati ottenuti
      </p>

      {/* Certificate list */}
      <div className="mt-6 space-y-2.5">
        {PLACEHOLDER_CERTIFICATES.map((cert) => (
          <Card key={cert.id} className="flex items-center gap-4 p-4">
            {/* Icon */}
            <div className="w-[52px] h-[52px] rounded-lg shrink-0 flex items-center justify-center bg-accent-cyan/[0.08]">
              <span className="text-xl">{cert.emoji}</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-heading text-[0.88rem] font-semibold text-text-primary truncate">
                {cert.courseName}
              </p>
              <div className="flex items-center gap-2 mt-1 text-text-muted text-[0.68rem]">
                <span>{cert.issuedAt}</span>
                <span className="text-border-hover">·</span>
                <span className="font-mono tracking-wide">{cert.verifyCode}</span>
              </div>
            </div>

            {/* Download button */}
            <button
              type="button"
              className="shrink-0 font-heading text-[0.72rem] font-semibold bg-surface-3 text-accent-cyan px-4 py-2 rounded-full hover:bg-surface-4 transition-colors flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v7.5M4 7l3 3 3-3M3 11.5h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Scarica PDF
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
