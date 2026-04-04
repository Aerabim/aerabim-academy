import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { LearningPathsHero } from '@/components/learning-paths/LearningPathsHero';
import { LearningPathGrid } from '@/components/learning-paths/LearningPathGrid';
import type { LearningPath } from '@/types';

export default async function LearningPathsPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = getSupabaseAdmin();

  let paths: LearningPath[] = [];
  let stepCounts: Record<string, number> = {};
  const completedPathIds = new Set<string>();
  const startedPathIds = new Set<string>();

  if (admin) {
    try {
      // Fetch published paths ordered by order_num
      const { data: pathsData } = await admin
        .from('learning_paths')
        .select('*')
        .eq('is_published', true)
        .order('order_num', { ascending: true });

      paths = (pathsData ?? []) as unknown as LearningPath[];

      if (paths.length > 0) {
        const pathIds = paths.map((p) => p.id);

        // Step counts per path
        const { data: stepsData } = await admin
          .from('learning_path_steps')
          .select('path_id')
          .in('path_id', pathIds);

        for (const s of (stepsData ?? []) as { path_id: string }[]) {
          stepCounts[s.path_id] = (stepCounts[s.path_id] ?? 0) + 1;
        }

        // User's learning_path_progress (only if authenticated)
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
            } else if (row.completed_step_ids.length > 0) {
              startedPathIds.add(row.path_id);
            }
          }
        }
      }
    } catch (err) {
      console.error('LearningPathsPage error:', err);
    }
  }

  return (
    <div className="w-full px-6 lg:px-9 pt-3 pb-7 space-y-6">
      <LearningPathsHero />
      <LearningPathGrid
        paths={paths}
        stepCounts={stepCounts}
        completedPathIds={completedPathIds}
        startedPathIds={startedPathIds}
      />
    </div>
  );
}
