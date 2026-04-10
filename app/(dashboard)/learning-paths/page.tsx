import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { LearningPathsHero } from '@/components/learning-paths/LearningPathsHero';
import { LearningPathBanners } from '@/components/learning-paths/LearningPathBanners';
import { EnterpriseCtaBanner } from '@/components/learning-paths/EnterpriseCtaBanner';
import type { BannerPath, CourseChip } from '@/components/learning-paths/LearningPathBanner';
import type { AreaCode } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';

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
        .select('id, slug, title, subtitle, thumbnail_url, thumbnail_position, estimated_hours')
        .eq('status', 'published')
        .order('order_num', { ascending: true });

      const rawPaths = (pathsData ?? []) as {
        id: string; slug: string; title: string; subtitle: string | null;
        thumbnail_url: string | null; estimated_hours: number | null;
        thumbnail_position: string;
      }[];

      if (rawPaths.length > 0) {
        const pathIds = rawPaths.map((p) => p.id);

        // Fetch courses in each path for preview chips (max 3 per path)
        const { data: coursesData } = await admin
          .from('learning_path_courses')
          .select('path_id, courses(id, title, thumbnail_url, area)')
          .in('path_id', pathIds)
          .order('order_num', { ascending: true });

        const rawCourses = (coursesData ?? []) as unknown as {
          path_id: string;
          courses: { id: string; title: string; thumbnail_url: string | null; area: string } | null;
        }[];

        // Course count per path + preview chips (max 3)
        const courseCounts = new Map<string, number>();
        const courseChips = new Map<string, CourseChip[]>();

        for (const r of rawCourses) {
          courseCounts.set(r.path_id, (courseCounts.get(r.path_id) ?? 0) + 1);

          if (r.courses) {
            const chips = courseChips.get(r.path_id) ?? [];
            if (chips.length < 3) {
              chips.push({
                id: r.courses.id,
                title: r.courses.title,
                thumbnailUrl: r.courses.thumbnail_url,
                area: r.courses.area as AreaCode,
              });
              courseChips.set(r.path_id, chips);
            }
          }
        }

        // User progress (completed / started) + favorite path IDs
        const completedPathIds = new Set<string>();
        const startedPathIds = new Set<string>();
        const favoritePathIds = new Set<string>();

        if (user) {
          const [lppData, favData] = await Promise.all([
            admin
              .from('learning_path_progress')
              .select('path_id, is_completed')
              .eq('user_id', user.id)
              .in('path_id', pathIds),
            (supabase as unknown as SupabaseClient)
              .from('favorites')
              .select('path_id')
              .eq('user_id', user.id)
              .not('path_id', 'is', null),
          ]);

          for (const row of (lppData.data ?? []) as { path_id: string; is_completed: boolean }[]) {
            if (row.is_completed) {
              completedPathIds.add(row.path_id);
            } else {
              startedPathIds.add(row.path_id);
            }
          }

          for (const row of (favData.data ?? []) as { path_id: string }[]) {
            favoritePathIds.add(row.path_id);
          }
        }

        bannerPaths = rawPaths.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          subtitle: p.subtitle,
          thumbnailUrl: p.thumbnail_url,
          thumbnailPosition: p.thumbnail_position ?? '50% 50%',
          estimatedHours: p.estimated_hours,
          courseCount: courseCounts.get(p.id) ?? 0,
          isCompleted: completedPathIds.has(p.id),
          hasStarted: startedPathIds.has(p.id),
          coursePreview: courseChips.get(p.id) ?? [],
          initialFavorited: favoritePathIds.has(p.id),
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
      <div className="px-6 lg:px-9">
        <EnterpriseCtaBanner />
      </div>
    </div>
  );
}
