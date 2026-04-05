import { createServerClient } from '@/lib/supabase/server';
import { CatalogoCorsiHero } from '@/components/corso/CatalogoCorsiHero';
import { CatalogHero } from '@/components/corso/CatalogHero';
import { CatalogBrowser } from '@/components/corso/CatalogBrowser';
import { RequestCourseCtaBanner } from '@/components/corso/RequestCourseCtaBanner';
import { getPublishedCourses, getFeaturedCourse } from '@/lib/catalog/queries';
import { checkIsAdmin } from '@/lib/learn/queries';
import type { CourseWithMeta } from '@/types';

export default async function CatalogoCorsiPage() {
  let courses: CourseWithMeta[] = [];
  let featured: CourseWithMeta | null = null;

  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user ? await checkIsAdmin(supabase, user.id) : false;
    courses = await getPublishedCourses(supabase, { isAdmin });
    featured = await getFeaturedCourse(supabase, courses);
  } catch {
    courses = [];
    featured = null;
  }

  if (courses.length === 0) {
    return (
      <div className="w-full px-6 lg:px-9 py-7">
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📚</span>
          </div>
          <h2 className="font-heading text-lg font-bold text-text-primary mb-2">
            Nessun corso disponibile
          </h2>
          <p className="text-text-secondary text-sm max-w-sm mx-auto">
            I corsi sono in fase di preparazione. Torna presto per scoprire il catalogo completo!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 lg:px-9 py-7 space-y-8">
      <CatalogoCorsiHero />
      {featured && <CatalogHero course={featured} />}
      <CatalogBrowser courses={courses} />
      <RequestCourseCtaBanner />
    </div>
  );
}
