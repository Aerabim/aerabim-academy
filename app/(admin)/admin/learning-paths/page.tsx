export const dynamic = 'force-dynamic';

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { LearningPathTable } from '@/components/admin/learning-paths/LearningPathTable';
import type { AdminLearningPathListItem, LearningPathStatus } from '@/types';

export default async function AdminLearningPathsPage() {
  const admin = getSupabaseAdmin();
  let paths: AdminLearningPathListItem[] = [];

  if (admin) {
    try {
      const { data } = await admin
        .from('learning_paths')
        .select('id, slug, title, status, thumbnail_url, estimated_hours, created_at, updated_at')
        .order('order_num', { ascending: true });

      const rawPaths = (data ?? []) as {
        id: string; slug: string; title: string;
        status: string; thumbnail_url: string | null;
        estimated_hours: number | null; created_at: string; updated_at: string;
      }[];

      const pathIds = rawPaths.map((p) => p.id);

      const { data: courseRows } = pathIds.length > 0
        ? await admin
            .from('learning_path_courses')
            .select('path_id')
            .in('path_id', pathIds)
        : { data: [] };

      const courseCount = new Map<string, number>();
      for (const r of ((courseRows ?? []) as { path_id: string }[])) {
        courseCount.set(r.path_id, (courseCount.get(r.path_id) ?? 0) + 1);
      }

      paths = rawPaths.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        status: p.status as LearningPathStatus,
        thumbnailUrl: p.thumbnail_url,
        estimatedHours: p.estimated_hours,
        courseCount: courseCount.get(p.id) ?? 0,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
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
