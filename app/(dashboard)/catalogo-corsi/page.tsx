import { CatalogHero } from '@/components/corso/CatalogHero';
import { CatalogBrowser } from '@/components/corso/CatalogBrowser';
import { PLACEHOLDER_COURSES, FEATURED_COURSE_SLUG } from '@/lib/placeholder-data';

export default function CatalogoCorsiPage() {
  const featured = PLACEHOLDER_COURSES.find((c) => c.slug === FEATURED_COURSE_SLUG);

  return (
    <div className="w-full px-6 lg:px-9 py-7 space-y-8">
      {featured && <CatalogHero course={featured} />}
      <CatalogBrowser courses={PLACEHOLDER_COURSES} />
    </div>
  );
}
