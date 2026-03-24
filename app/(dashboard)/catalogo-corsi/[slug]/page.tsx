import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { VideoPlayerPlaceholder } from '@/components/corso/VideoPlayerPlaceholder';
import { LessonList } from '@/components/corso/LessonList';
import { CourseDetailSidebar } from '@/components/corso/CourseDetailSidebar';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import { StarRatingDisplay } from '@/components/reviews/StarRating';
import { AREA_CONFIG, LEVEL_LABELS } from '@/lib/area-config';
import { formatDuration } from '@/lib/utils';
import { getCourseBySlug, getCourseModulesWithLessons } from '@/lib/catalog/queries';
import { checkIsAdmin } from '@/lib/learn/queries';
import { getCourseReviews, getCourseReviewStats, getUserReview } from '@/lib/reviews/queries';

interface PageProps {
  params: { slug: string };
  searchParams: { success?: string; canceled?: string };
}

export default async function CourseDetailPage({ params, searchParams }: PageProps) {
  const supabase = createServerClient();

  // Check auth + admin status early (needed for course visibility)
  let isEnrolled = false;
  let isAuthenticated = false;
  let currentUserId: string | null = null;
  let isAdmin = false;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticated = !!user;
    currentUserId = user?.id ?? null;
    if (user) {
      isAdmin = await checkIsAdmin(supabase, user.id);
    }
  } catch {
    // Default to not authenticated
  }

  // Fetch course from DB (admin sees all statuses)
  const course = await getCourseBySlug(supabase, params.slug, { isAdmin });
  if (!course) notFound();

  // Check enrollment status
  if (currentUserId) {
    try {
      if (isAdmin) {
        isEnrolled = true;
      } else {
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id, expires_at')
          .eq('user_id', currentUserId)
          .eq('course_id', course.id)
          .maybeSingle() as { data: { id: string; expires_at: string | null } | null };

        if (enrollment) {
          isEnrolled = !enrollment.expires_at || new Date(enrollment.expires_at) > new Date();
        }
      }
    } catch {
      // Default to not enrolled
    }
  }

  // Fetch modules + lessons and reviews in parallel
  const [modules, reviews, reviewStats, userReview] = await Promise.all([
    getCourseModulesWithLessons(supabase, course.id),
    getCourseReviews(supabase, course.id),
    getCourseReviewStats(supabase, course.id),
    currentUserId ? getUserReview(supabase, currentUserId, course.id) : Promise.resolve(null),
  ]);

  const area = AREA_CONFIG[course.area];

  return (
    <div className="w-full px-6 lg:px-9 py-7">
      {/* Success banner */}
      {searchParams.success === 'true' && (
        <div className="mb-5 px-4 py-3 rounded-md bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald text-[0.82rem] font-medium">
          Acquisto completato! Ora puoi accedere al corso.
        </div>
      )}

      {/* Canceled banner */}
      {searchParams.canceled === 'true' && (
        <div className="mb-5 px-4 py-3 rounded-md bg-accent-amber/10 border border-accent-amber/20 text-accent-amber text-[0.82rem] font-medium">
          Acquisto annullato. Puoi riprovare quando vuoi.
        </div>
      )}

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
            {reviewStats.reviewCount > 0 && (
              <>
                <span className="inline-flex items-center gap-1">
                  <StarRatingDisplay value={reviewStats.avgRating} count={reviewStats.reviewCount} size="sm" />
                </span>
                <span className="text-border-hover">·</span>
              </>
            )}
            {course.enrolledCount > 0 && (
              <>
                <span>{course.enrolledCount} iscritti</span>
                <span className="text-border-hover">·</span>
              </>
            )}
            <span>
              {course.durationMin > 0 ? `⏱ ${formatDuration(course.durationMin)} · ` : ''}
              {course.lessonCount} lezioni
            </span>
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

          {/* Reviews */}
          <ReviewSection
            courseId={course.id}
            initialReviews={reviews}
            initialStats={reviewStats}
            userReview={userReview}
            isEnrolled={isEnrolled}
            currentUserId={currentUserId}
          />
        </main>

        {/* Sidebar */}
        <CourseDetailSidebar
          course={course}
          materials={[]}
          objectives={[]}
          isEnrolled={isEnrolled}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
}
