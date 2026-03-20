import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface CourseItem {
  title: string;
  area: string;
  areaLabel: string;
  areaVariant: 'cyan' | 'amber' | 'rose' | 'emerald' | 'violet';
  module: string;
  progress: number;
  emoji: string;
  thumbGradient: string;
}

const COURSES: CourseItem[] = [
  {
    title: 'Esportare correttamente un IFC da Revit',
    area: 'SW',
    areaLabel: 'SW',
    areaVariant: 'cyan',
    module: 'Modulo 2 · Lez. 2.3',
    progress: 68,
    emoji: '📐',
    thumbGradient: 'from-[#0f2845] to-[#1a4a78]',
  },
  {
    title: "L'Allegato I.9 spiegato ai tecnici",
    area: 'NL',
    areaLabel: 'NL',
    areaVariant: 'violet',
    module: 'Modulo 1 · Lez. 1.2',
    progress: 35,
    emoji: '⚖️',
    thumbGradient: 'from-[#2a0f45] to-[#4a1a78]',
  },
  {
    title: 'Quale versione di IFC scegliere?',
    area: 'OB',
    areaLabel: 'OB',
    areaVariant: 'emerald',
    module: 'Modulo 3 · Lez. 3.1',
    progress: 92,
    emoji: '🌐',
    thumbGradient: 'from-[#0f4528] to-[#1a7848]',
  },
];

export function ContinueStudying() {
  return (
    <Card>
      <div className="px-5 pt-5 flex items-center justify-between">
        <div>
          <div className="font-heading text-[0.98rem] font-bold text-text-primary tracking-tight">
            Continua a Studiare
          </div>
          <div className="text-[0.72rem] text-text-muted mt-px">
            Riprendi da dove avevi lasciato
          </div>
        </div>
        <Link
          href="/i-miei-corsi"
          className="font-heading text-[0.76rem] text-accent-cyan font-semibold hover:text-[#5FE0D7] transition-colors"
        >
          Vedi tutti →
        </Link>
      </div>
      <div className="px-5 pb-5 pt-4 flex flex-col gap-2.5">
        {COURSES.map((course) => (
          <div
            key={course.title}
            className="flex items-center gap-3.5 p-3 bg-surface-2 rounded-md cursor-pointer border border-transparent hover:border-accent-cyan/[0.12] hover:bg-surface-3 hover:translate-x-[3px] transition-all"
          >
            <div className={`w-[52px] h-[52px] rounded-sm shrink-0 flex items-center justify-center text-xl bg-gradient-to-br ${course.thumbGradient}`}>
              {course.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[0.84rem] font-semibold text-text-primary mb-0.5 truncate">
                {course.title}
              </div>
              <div className="flex items-center gap-2 text-[0.7rem] text-text-muted">
                <Badge variant={course.areaVariant}>{course.areaLabel}</Badge>
                <span>{course.module}</span>
              </div>
              <ProgressBar percentage={course.progress} className="mt-[7px]" />
            </div>
            <div className="font-heading text-[0.74rem] font-bold text-accent-cyan shrink-0 min-w-[38px] text-right">
              {course.progress}%
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
