import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { VideoPlayerPlaceholder } from '@/components/corso/VideoPlayerPlaceholder';
import { LessonList } from '@/components/corso/LessonList';
import { CourseDetailSidebar } from '@/components/corso/CourseDetailSidebar';
import { AREA_CONFIG, LEVEL_LABELS } from '@/lib/area-config';
import { formatDuration } from '@/lib/utils';
import {
  PLACEHOLDER_COURSES,
  PLACEHOLDER_MODULES,
  PLACEHOLDER_OBJECTIVES,
  PLACEHOLDER_MATERIALS,
} from '@/lib/placeholder-data';

interface PageProps {
  params: { slug: string };
}

export default function CourseDetailPage({ params }: PageProps) {
  const course = PLACEHOLDER_COURSES.find((c) => c.slug === params.slug);
  if (!course) notFound();

  const area = AREA_CONFIG[course.area];
  const modules = PLACEHOLDER_MODULES[course.slug] || [];
  const objectives = PLACEHOLDER_OBJECTIVES[course.slug] || [];
  const materials = PLACEHOLDER_MATERIALS[course.slug] || [];

  return (
    <div className="w-full px-6 lg:px-9 py-7">
      {/* Back link */}
      <Link
        href="/catalogo-corsi"
        className="inline-flex items-center gap-1.5 text-text-muted text-[0.78rem] hover:text-text-secondary transition-colors mb-5"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 3L4.5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Torna al catalogo
      </Link>

      {/* Video player placeholder */}
      <VideoPlayerPlaceholder courseTitle={course.title} />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 mt-7">
        {/* Main column */}
        <main>
          {/* Tags */}
          <div className="flex items-center gap-2 mb-3">
            <Badge variant={area.badgeVariant}>{area.label}</Badge>
            <Badge>{LEVEL_LABELS[course.level]}</Badge>
          </div>

          {/* Title */}
          <h1 className="font-heading text-xl lg:text-[1.65rem] font-extrabold text-text-primary leading-tight mb-4">
            {course.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-[0.72rem] text-text-muted mb-5">
            <span className="flex items-center gap-0.5">
              <span className="text-accent-amber">★</span> {course.rating}
            </span>
            <span className="text-border-hover">·</span>
            <span>{course.enrolledCount} iscritti</span>
            <span className="text-border-hover">·</span>
            <span>⏱ {formatDuration(course.durationMin)} · {course.lessonCount} lezioni</span>
            <span className="text-border-hover">·</span>
            <span>Aggiornato {course.updatedAt}</span>
          </div>

          {/* Description */}
          <p className="text-text-secondary text-sm leading-relaxed mb-8">
            {course.description}
          </p>

          {/* Lesson list */}
          {modules.length > 0 ? (
            <LessonList modules={modules} />
          ) : (
            <div className="bg-surface-1 border border-border-subtle rounded-lg p-8 text-center">
              <p className="text-text-muted text-sm">
                Il programma dettagliato del corso sarà disponibile a breve.
              </p>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <CourseDetailSidebar
          course={course}
          materials={materials}
          objectives={objectives}
        />
      </div>
    </div>
  );
}
