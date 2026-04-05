import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { LearningPathsHero } from '@/components/learning-paths/LearningPathsHero';
import { LearningPathBanners } from '@/components/learning-paths/LearningPathBanners';
import type { BannerPath, CourseChip } from '@/components/learning-paths/LearningPathBanner';
import type { AreaCode } from '@/types';

export default async function LearningPathsPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = getSupabaseAdmin();

  let bannerPaths: BannerPath[] = [];

  if (admin) {
    try {
      // Fetch published paths ordered by order_num
      const { data: pathsData } = await admin
        .from('learning_paths')
        .select('id, slug, title, subtitle, thumbnail_url, estimated_hours')
        .eq('is_published', true)
        .order('order_num', { ascending: true });

      const rawPaths = (pathsData ?? []) as {
        id: string; slug: string; title: string; subtitle: string | null;
        thumbnail_url: string | null; estimated_hours: number | null;
      }[];

      if (rawPaths.length > 0) {
        const pathIds = rawPaths.map((p) => p.id);

        // Fetch steps with course info for preview chips (only course-type steps)
        const { data: stepsData } = await admin
          .from('learning_path_steps')
          .select('path_id, step_type, courses(id, title, thumbnail_url, area)')
          .in('path_id', pathIds)
          .order('order_num', { ascending: true });

        const rawSteps = (stepsData ?? []) as unknown as {
          path_id: string;
          step_type: string;
          courses: { id: string; title: string; thumbnail_url: string | null; area: string } | null;
        }[];

        // Step count per path (all types)
        const stepCounts = new Map<string, number>();
        // Course preview chips per path (max 3 course-type steps)
        const courseChips = new Map<string, CourseChip[]>();

        for (const s of rawSteps) {
          stepCounts.set(s.path_id, (stepCounts.get(s.path_id) ?? 0) + 1);

          if (s.step_type === 'course' && s.courses) {
            const chips = courseChips.get(s.path_id) ?? [];
            if (chips.length < 3) {
              chips.push({
                id: s.courses.id,
                title: s.courses.title,
                thumbnailUrl: s.courses.thumbnail_url,
                area: s.courses.area as AreaCode,
              });
              courseChips.set(s.path_id, chips);
            }
          }
        }

        // User progress (completed / started)
        const completedPathIds = new Set<string>();
        const startedPathIds = new Set<string>();

        if (user) {
          const { data: lppData } = await admin
            .from('learning_path_progress')
            .select('path_id, is_completed, completed_step_ids')
            .eq('user_id', user.id)
            .in('path_id', pathIds);

          for (const row of (lppData ?? []) as {
            path_id: string; is_completed: boolean; completed_step_ids: string[];
          }[]) {
            if (row.is_completed) {
              completedPathIds.add(row.path_id);
            } else if (row.completed_step_ids?.length > 0) {
              startedPathIds.add(row.path_id);
            }
          }
        }

        bannerPaths = rawPaths.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          subtitle: p.subtitle,
          thumbnailUrl: p.thumbnail_url,
          estimatedHours: p.estimated_hours,
          stepCount: stepCounts.get(p.id) ?? 0,
          isCompleted: completedPathIds.has(p.id),
          hasStarted: startedPathIds.has(p.id),
          coursePreview: courseChips.get(p.id) ?? [],
        }));
      }
    } catch (err) {
      console.error('LearningPathsPage error:', err);
    }
  }

  return (
    <div className="w-full pt-3 pb-7 space-y-6">
      <div className="px-6 lg:px-9">
        <LearningPathsHero />
      </div>
      <div className="px-6 lg:px-9">
        <LearningPathBanners paths={bannerPaths} />
      </div>
    </div>
  );
}
