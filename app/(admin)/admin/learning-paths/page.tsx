export const dynamic = 'force-dynamic';

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { LearningPathTable } from '@/components/admin/learning-paths/LearningPathTable';
import type { AdminLearningPathListItem } from '@/types';

export default async function AdminLearningPathsPage() {
  const admin = getSupabaseAdmin();
  let paths: AdminLearningPathListItem[] = [];

  if (admin) {
    try {
      const { data } = await admin
        .from('learning_paths')
        .select('id, slug, title, target_role, level, is_published, estimated_hours, created_at')
        .order('order_num', { ascending: true });

      const rawPaths = (data ?? []) as {
        id: string; slug: string; title: string; target_role: string | null;
        level: string | null; is_published: boolean; estimated_hours: number | null; created_at: string;
      }[];

      const pathIds = rawPaths.map((p) => p.id);

      const { data: stepRows } = pathIds.length > 0
        ? await admin
            .from('learning_path_steps')
            .select('path_id, step_type')
            .in('path_id', pathIds)
        : { data: [] };

      const steps = (stepRows ?? []) as { path_id: string; step_type: string }[];

      const stepCount = new Map<string, number>();
      const courseCount = new Map<string, number>();
      for (const s of steps) {
        stepCount.set(s.path_id, (stepCount.get(s.path_id) ?? 0) + 1);
        if (s.step_type === 'course') {
          courseCount.set(s.path_id, (courseCount.get(s.path_id) ?? 0) + 1);
        }
      }

      paths = rawPaths.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        targetRole: p.target_role,
        level: p.level as AdminLearningPathListItem['level'],
        isPublished: p.is_published,
        estimatedHours: p.estimated_hours,
        stepCount: stepCount.get(p.id) ?? 0,
        courseCount: courseCount.get(p.id) ?? 0,
        createdAt: p.created_at,
      }));
    } catch (err) {
      console.error('Admin learning-paths page error:', err);
    }
  }

  return (
    <div className="p-6 lg:p-10 w-full">
      <div className="mb-6">
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">
          Gestione Percorsi
        </h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">
          Crea e gestisci i percorsi formativi guidati per ruolo professionale.
        </p>
      </div>
      <LearningPathTable paths={paths} />
    </div>
  );
}
