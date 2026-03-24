import { createServerClient } from '@/lib/supabase/server';
import { getPublishedCourses } from '@/lib/catalog/queries';
import { FavoritesGrid } from '@/components/corso/FavoritesGrid';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CourseWithMeta } from '@/types';

export default async function PreferitiPage() {
  const supabase = createServerClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="w-full px-6 lg:px-9 py-7">
        <EmptyState message="Accedi per vedere i tuoi preferiti." />
      </div>
    );
  }

  // Use untyped client for favorites table
  const db = supabase as unknown as SupabaseClient;

  // Fetch user's favorites
  const { data: favRows } = await db
    .from('favorites')
    .select('course_id')
    .eq('user_id', user.id);

  const favoriteIds = new Set((favRows ?? []).map((f: { course_id: string }) => f.course_id));

  // Fetch all published courses and filter to favorites
  let favoriteCourses: CourseWithMeta[] = [];
  if (favoriteIds.size > 0) {
    try {
      const allCourses = await getPublishedCourses(supabase);
      favoriteCourses = allCourses.filter((c) => favoriteIds.has(c.id));
    } catch {
      favoriteCourses = [];
    }
  }

  return (
    <div className="w-full px-6 lg:px-9 py-7 space-y-6">
      <div>
        <h1 className="font-heading text-[1.4rem] font-bold text-text-primary">
          I Miei Preferiti
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          I corsi che hai salvato per dopo
        </p>
      </div>

      {favoriteCourses.length === 0 ? (
        <EmptyState message="Non hai ancora aggiunto corsi ai preferiti. Esplora il catalogo e clicca il segnalibro per salvarli qui." />
      ) : (
        <FavoritesGrid courses={favoriteCourses} />
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-4">
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="text-text-muted">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        </svg>
      </div>
      <h2 className="font-heading text-lg font-bold text-text-primary mb-2">
        Nessun preferito
      </h2>
      <p className="text-text-secondary text-sm max-w-sm mx-auto">
        {message}
      </p>
    </div>
  );
}
