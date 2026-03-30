import { Card } from '@/components/ui/Card';
import { PurchaseCard } from '@/components/corso/PurchaseCard';
import type { CourseWithMeta, CourseMaterial } from '@/types';

interface CourseDetailSidebarProps {
  course: CourseWithMeta;
  materials: CourseMaterial[];
  objectives: string[];
  isEnrolled: boolean;
  isAuthenticated: boolean;
}

const FORMAT_COLORS: Record<string, string> = {
  pdf:  'bg-accent-rose/15 text-accent-rose',
  pptx: 'bg-accent-amber/15 text-accent-amber',
  xlsx: 'bg-accent-emerald/15 text-accent-emerald',
  docx: 'bg-brand-light/20 text-brand-light',
  rvt:  'bg-accent-cyan/15 text-accent-cyan',
  rfa:  'bg-accent-cyan/15 text-accent-cyan',
  nwd:  'bg-violet-400/15 text-violet-400',
  nwc:  'bg-violet-400/15 text-violet-400',
  dwg:  'bg-accent-amber/15 text-accent-amber',
  dxf:  'bg-accent-amber/15 text-accent-amber',
  ifc:  'bg-accent-cyan/15 text-accent-cyan',
  exe:  'bg-accent-rose/15 text-accent-rose',
  zip:  'bg-brand-gray/20 text-brand-light',
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CourseDetailSidebar({ course, materials, objectives, isEnrolled, isAuthenticated }: CourseDetailSidebarProps) {
  return (
    <aside className="space-y-5">
      {/* Purchase CTA */}
      <PurchaseCard
        courseId={course.id}
        courseSlug={course.slug}
        priceSingle={course.priceSingle}
        isFree={course.isFree}
        isEnrolled={isEnrolled}
        isAuthenticated={isAuthenticated}
      />

      {/* Instructor */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-cyan/30 to-brand-blue flex items-center justify-center font-heading text-sm font-bold text-text-primary">
            {course.instructor.initials}
          </div>
          <div>
            <p className="font-heading text-[0.88rem] font-semibold text-text-primary">
              {course.instructor.name}
            </p>
            <p className="text-text-muted text-[0.72rem]">{course.instructor.role}</p>
          </div>
        </div>
      </Card>

      {/* Learning objectives */}
      {objectives.length > 0 && (
        <Card className="p-5">
          <h3 className="font-heading text-[0.85rem] font-bold text-text-primary mb-3">
            Cosa imparerai
          </h3>
          <ul className="space-y-2.5">
            {objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[0.78rem] text-text-secondary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5 text-accent-cyan">
                  <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Languages */}
      <Card className="p-5">
        <h3 className="font-heading text-[0.85rem] font-bold text-text-primary mb-3">
          Lingue
        </h3>
        <div className="flex flex-wrap gap-2">
          {course.languages.map((lang) => (
            <span
              key={lang}
              className="font-heading text-[0.68rem] font-semibold px-2.5 py-1 rounded bg-accent-cyan/10 text-accent-cyan"
            >
              🇮🇹 {lang}
            </span>
          ))}
        </div>
      </Card>

      {/* Materials — only visible to enrolled users */}
      {materials.length > 0 && (
        <Card className="p-5">
          <h3 className="font-heading text-[0.85rem] font-bold text-text-primary mb-3">
            Materiali inclusi
          </h3>
          <ul className="space-y-2.5">
            {materials.map((mat) => (
              <li key={mat.id} className="flex items-center gap-3 group">
                <span className={`font-heading text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${FORMAT_COLORS[mat.fileType] ?? 'bg-surface-3 text-text-muted'}`}>
                  {mat.fileType}
                </span>
                <span className="text-[0.78rem] text-text-secondary flex-1 truncate">
                  {mat.title}
                </span>
                <span className="text-[0.65rem] text-text-muted shrink-0">
                  {formatBytes(mat.fileSize)}
                </span>
                <a
                  href={mat.fileUrl}
                  download={mat.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Scarica"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-accent-cyan">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Certificate card */}
      <Card className="p-5 border-accent-cyan/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🏅</span>
          <div>
            <h3 className="font-heading text-[0.85rem] font-bold text-text-primary mb-1">
              Certificato incluso
            </h3>
            <p className="text-[0.72rem] text-text-muted">
              Completando il corso riceverai un certificato verificabile con codice univoco.
            </p>
          </div>
        </div>
      </Card>

      {/* AI Tutor promo */}
      <Card className="p-5 bg-gradient-to-br from-surface-1 to-accent-cyan/[0.04]">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="font-heading text-[0.85rem] font-bold text-text-primary mb-1">
              AI Tutor
            </h3>
            <p className="text-[0.72rem] text-text-muted mb-3">
              Hai bisogno di aiuto? Il tutor AI ti assiste 24/7 su qualsiasi argomento del corso.
            </p>
            <span className="inline-block font-heading text-[0.72rem] font-semibold bg-accent-cyan/10 text-accent-cyan px-3 py-1.5 rounded-full">
              Chiedi all&apos;AI Tutor
            </span>
          </div>
        </div>
      </Card>
    </aside>
  );
}
