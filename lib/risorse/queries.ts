import { createServerClient } from '@/lib/supabase/server';
import type { AreaCode, ArticleDisplay, ArticleDetail, PressMentionDisplay } from '@/types';

type TypedClient = ReturnType<typeof createServerClient>;

// ── Row types (Supabase generic inference workaround) ──

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_url: string | null;
  area: string | null;
  author_name: string;
  author_role: string;
  published_at: string | null;
  read_min: number;
  related_course_id: string | null;
}

interface PressRow {
  id: string;
  title: string;
  source_name: string;
  source_url: string;
  source_logo: string | null;
  excerpt: string | null;
  published_at: string;
}

interface CourseSlugRow {
  id: string;
  slug: string;
  title: string;
}

// ── Helper: map article row to display ──────────────────

function mapArticle(row: ArticleRow, courseMap?: Map<string, CourseSlugRow>): ArticleDisplay {
  const course = row.related_course_id ? courseMap?.get(row.related_course_id) : undefined;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverUrl: row.cover_url,
    area: row.area as AreaCode | null,
    authorName: row.author_name,
    authorRole: row.author_role,
    publishedAt: row.published_at ?? '',
    readMin: row.read_min,
    relatedCourseSlug: course?.slug ?? null,
  };
}

// ── Get all published articles ──────────────────────────

export async function getPublishedArticles(
  supabase: TypedClient,
  area?: string,
): Promise<ArticleDisplay[]> {
  let query = supabase
    .from('articles')
    .select('id, slug, title, excerpt, cover_url, area, author_name, author_role, published_at, read_min, related_course_id')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (area && area !== 'all') {
    query = query.eq('area', area);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const articles = data as unknown as ArticleRow[];

  // Resolve related courses
  const courseIds = articles
    .map((a) => a.related_course_id)
    .filter((id): id is string => id !== null);

  let courseMap = new Map<string, CourseSlugRow>();
  if (courseIds.length > 0) {
    const { data: rawCourses } = await supabase
      .from('courses')
      .select('id, slug, title')
      .in('id', courseIds);
    const courses = (rawCourses ?? []) as unknown as CourseSlugRow[];
    courseMap = new Map(courses.map((c) => [c.id, c]));
  }

  return articles.map((a) => mapArticle(a, courseMap));
}

// ── Get single article by slug ──────────────────────────

export async function getArticleBySlug(
  supabase: TypedClient,
  slug: string,
): Promise<ArticleDetail | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, title, excerpt, body, cover_url, area, author_name, author_role, published_at, read_min, related_course_id')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as ArticleRow;

  // Resolve related course
  let relatedCourseSlug: string | null = null;
  let relatedCourseTitle: string | null = null;

  if (row.related_course_id) {
    const { data: rawCourse } = await supabase
      .from('courses')
      .select('slug, title')
      .eq('id', row.related_course_id)
      .single();
    const course = rawCourse as { slug: string; title: string } | null;
    relatedCourseSlug = course?.slug ?? null;
    relatedCourseTitle = course?.title ?? null;
  }

  return {
    ...mapArticle(row),
    body: row.body,
    relatedCourseSlug,
    relatedCourseTitle,
  };
}

// ── Get all published press mentions ────────────────────

export async function getPublishedPressMentions(
  supabase: TypedClient,
): Promise<PressMentionDisplay[]> {
  const { data, error } = await supabase
    .from('press_mentions')
    .select('id, title, source_name, source_url, source_logo, excerpt, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (error || !data) return [];

  return (data as unknown as PressRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    sourceLogo: row.source_logo,
    excerpt: row.excerpt,
    publishedAt: row.published_at,
  }));
}
