import { createServerClient } from '@/lib/supabase/server';
import { getPublishedCourses } from '@/lib/catalog/queries';
import { PreferitiContent } from '@/components/preferiti/PreferitiContent';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CourseWithMeta } from '@/types';
import type { FavArticle, FavPath, FavSession } from '@/components/preferiti/PreferitiContent';

type FavRow = {
  id: string;
  course_id: string | null;
  article_id: string | null;
  path_id: string | null;
  session_id: string | null;
};

export default async function PreferitiPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="w-full px-6 lg:px-9 py-7">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="font-heading text-[1rem] font-bold text-text-primary mb-2">Accesso richiesto</h2>
          <p className="text-[0.82rem] text-text-secondary">Accedi per vedere i tuoi preferiti.</p>
        </div>
      </div>
    );
  }

  const db = supabase as unknown as SupabaseClient;

  // Fetch all favorites rows
  const { data: favRows } = await db
    .from('favorites')
    .select('id, course_id, article_id, path_id, session_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const rows = (favRows ?? []) as FavRow[];

  const courseIds  = rows.filter((r) => r.course_id).map((r) => r.course_id!);
  const articleIds = rows.filter((r) => r.article_id).map((r) => r.article_id!);
  const pathIds    = rows.filter((r) => r.path_id).map((r) => r.path_id!);
  const sessionIds = rows.filter((r) => r.session_id).map((r) => r.session_id!);

  // Parallel fetch of actual item data
  const [allCourses, articlesRes, pathsRes, sessionsRes] = await Promise.all([
    courseIds.length > 0
      ? getPublishedCourses(supabase).catch(() => [] as CourseWithMeta[])
      : Promise.resolve([] as CourseWithMeta[]),

    articleIds.length > 0
      ? db.from('articles').select('id, slug, title, area, cover_url, read_min, author_name, excerpt').in('id', articleIds)
      : Promise.resolve({ data: [] }),

    pathIds.length > 0
      ? db.from('learning_paths').select('id, slug, title, thumbnail_url, estimated_hours').in('id', pathIds)
      : Promise.resolve({ data: [] }),

    sessionIds.length > 0
      ? db.from('live_sessions').select('id, title, type, scheduled_at, duration_min, host_name, status').in('id', sessionIds)
      : Promise.resolve({ data: [] }),
  ]);

  const corsi: CourseWithMeta[] = (allCourses as CourseWithMeta[]).filter((c) => courseIds.includes(c.id));

  type RawArticle = { id: string; slug: string; title: string; area: string | null; cover_url: string | null; read_min: number; author_name: string; excerpt: string | null };
  const articoli: FavArticle[] = ((articlesRes.data ?? []) as RawArticle[]).map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    area: a.area,
    coverUrl: a.cover_url,
    readMin: a.read_min,
    authorName: a.author_name,
    excerpt: a.excerpt,
  }));

  type RawPath = { id: string; slug: string; title: string; thumbnail_url: string | null; estimated_hours: number | null };
  const percorsi: FavPath[] = ((pathsRes.data ?? []) as RawPath[]).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    thumbnailUrl: p.thumbnail_url,
    estimatedHours: p.estimated_hours,
    stepCount: 0,
  }));

  type RawSession = { id: string; title: string; type: string; scheduled_at: string; duration_min: number; host_name: string; status: string };
  const sessioni: FavSession[] = ((sessionsRes.data ?? []) as RawSession[]).map((s) => ({
    id: s.id,
    title: s.title,
    type: s.type as 'webinar' | 'mentoring',
    scheduledAt: s.scheduled_at,
    durationMin: s.duration_min,
    hostName: s.host_name,
    status: s.status,
  }));

  return (
    <div className="w-full px-6 lg:px-9 py-7">
      <div className="mb-7">
        <h1 className="font-heading text-[1.4rem] font-bold text-text-primary tracking-tight">
          I Miei Preferiti
        </h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">
          Corsi, articoli, percorsi ed esami che hai salvato.
        </p>
      </div>

      <PreferitiContent
        corsi={corsi}
        articoli={articoli}
        percorsi={percorsi}
        sessioni={sessioni}
      />
    </div>
  );
}
