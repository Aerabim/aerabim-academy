import { Card } from '@/components/ui/Card';
import type { CourseWithMeta, CourseMaterial } from '@/types';

interface CourseDetailSidebarProps {
  course: CourseWithMeta;
  materials: CourseMaterial[];
  objectives: string[];
}

const FORMAT_COLORS: Record<string, string> = {
  PDF: 'bg-accent-rose/15 text-accent-rose',
  RVT: 'bg-accent-cyan/15 text-accent-cyan',
  XLSX: 'bg-accent-emerald/15 text-accent-emerald',
  DWG: 'bg-accent-amber/15 text-accent-amber',
};

export function CourseDetailSidebar({ course, materials, objectives }: CourseDetailSidebarProps) {
  return (
    <aside className="space-y-5">
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

      {/* Materials */}
      {materials.length > 0 && (
        <Card className="p-5">
          <h3 className="font-heading text-[0.85rem] font-bold text-text-primary mb-3">
            Materiali inclusi
          </h3>
          <ul className="space-y-2.5">
            {materials.map((mat, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className={`font-heading text-[0.6rem] font-bold px-1.5 py-0.5 rounded ${FORMAT_COLORS[mat.format] || 'bg-surface-3 text-text-muted'}`}>
                  {mat.format}
                </span>
                <span className="text-[0.78rem] text-text-secondary flex-1 truncate">
                  {mat.title}
                </span>
                <span className="text-[0.65rem] text-text-muted shrink-0">{mat.sizeLabel}</span>
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
