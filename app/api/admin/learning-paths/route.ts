import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, CreateLearningPathPayload } from '@/types';

/** GET /api/admin/learning-paths — list all paths with step counts */
export async function GET() {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { data, error } = await admin
      .from('learning_paths')
      .select('id, slug, title, status, thumbnail_url, estimated_hours, created_at, updated_at')
      .order('order_num', { ascending: true });

    if (error) {
      console.error('GET learning-paths error:', error);
      return NextResponse.json(
        { error: 'Errore nel caricamento dei percorsi.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const paths = (data ?? []) as {
      id: string; slug: string; title: string;
      status: string; thumbnail_url: string | null;
      estimated_hours: number | null; created_at: string; updated_at: string;
    }[];

    const pathIds = paths.map((p) => p.id);

    // Fetch course counts per path in a single query
    const { data: courseRows } = pathIds.length > 0
      ? await admin
          .from('learning_path_courses')
          .select('path_id')
          .in('path_id', pathIds)
      : { data: [] };

    const courseCountByPath = new Map<string, number>();
    for (const r of ((courseRows ?? []) as { path_id: string }[])) {
      courseCountByPath.set(r.path_id, (courseCountByPath.get(r.path_id) ?? 0) + 1);
    }

    const items = paths.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      status: p.status,
      thumbnailUrl: p.thumbnail_url,
      estimatedHours: p.estimated_hours,
      courseCount: courseCountByPath.get(p.id) ?? 0,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json({ paths: items });
  } catch (err) {
    console.error('GET /api/admin/learning-paths error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** POST /api/admin/learning-paths — create a new learning path */
export async function POST(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = (await req.json()) as CreateLearningPathPayload;

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Il titolo del percorso è obbligatorio.' } satisfies ApiError,
        { status: 400 },
      );
    }
    if (!body.slug?.trim()) {
      return NextResponse.json(
        { error: 'Lo slug del percorso è obbligatorio.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(body.slug)) {
      return NextResponse.json(
        { error: 'Lo slug può contenere solo lettere minuscole, numeri e trattini.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Check slug uniqueness
    const { data: existing } = await admin
      .from('learning_paths')
      .select('id')
      .eq('slug', body.slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Slug già in uso da un altro percorso.' } satisfies ApiError,
        { status: 409 },
      );
    }

    // Compute next order_num
    const { data: last } = await admin
      .from('learning_paths')
      .select('order_num')
      .order('order_num', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = ((last as { order_num: number } | null)?.order_num ?? 0) + 1;

    const { data: path, error } = await admin
      .from('learning_paths')
      .insert({
        title: body.title.trim(),
        slug: body.slug.trim(),
        subtitle: body.subtitle ?? null,
        description: body.description ?? null,
        thumbnail_url: body.thumbnailUrl ?? null,
        estimated_hours: body.estimatedHours ?? null,
        status: 'draft',
        order_num: nextOrder,
      })
      .select('id, slug')
      .single();

    if (error || !path) {
      console.error('Insert learning_path error:', error);
      return NextResponse.json(
        { error: 'Errore durante la creazione del percorso.' } satisfies ApiError,
        { status: 500 },
      );
    }

    revalidatePath('/admin/learning-paths');
    return NextResponse.json({ path }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/learning-paths error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
