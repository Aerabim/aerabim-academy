import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

export async function POST(
  _request: Request,
  { params }: { params: { pathId: string } },
) {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;

  const { admin } = auth;

  try {
    // 1. Fetch original path
    const { data: original, error: pathErr } = await admin
      .from('learning_paths')
      .select('*')
      .eq('id', params.pathId)
      .single();

    if (pathErr || !original) {
      return NextResponse.json({ error: 'Percorso non trovato.' } satisfies ApiError, { status: 404 });
    }

    const path = original as Record<string, unknown>;

    // 2. Generate unique slug
    let newSlug = `${path.slug}-copia`;
    let slugCounter = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: existing } = await admin
        .from('learning_paths')
        .select('id')
        .eq('slug', newSlug)
        .maybeSingle();
      if (!existing) break;
      slugCounter++;
      newSlug = `${path.slug}-copia-${slugCounter}`;
    }

    // 3. Compute next order_num
    const { data: last } = await admin
      .from('learning_paths')
      .select('order_num')
      .order('order_num', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = ((last as { order_num: number } | null)?.order_num ?? 0) + 1;

    // 4. Create new path (draft, no stripe_price_id)
    const { data: newPath, error: insertErr } = await admin
      .from('learning_paths')
      .insert({
        title: `${path.title} (Copia)`,
        slug: newSlug,
        subtitle: path.subtitle,
        description: path.description,
        thumbnail_url: path.thumbnail_url,
        level: path.level,
        target_role: path.target_role,
        estimated_hours: path.estimated_hours,
        price_single: path.price_single,
        stripe_price_id: null,
        status: 'draft',
        order_num: nextOrder,
      })
      .select('id, slug, title')
      .single();

    if (insertErr || !newPath) {
      console.error('Insert learning_path error:', insertErr);
      return NextResponse.json({ error: 'Errore nella duplicazione del percorso.' } satisfies ApiError, { status: 500 });
    }

    const newPathRow = newPath as { id: string; slug: string; title: string };

    // 5. Duplicate courses (ordered references)
    const { data: coursesRaw } = await admin
      .from('learning_path_courses')
      .select('course_id, order_num')
      .eq('path_id', params.pathId)
      .order('order_num', { ascending: true });

    const courses = (coursesRaw ?? []) as { course_id: string; order_num: number }[];

    if (courses.length > 0) {
      await admin.from('learning_path_courses').insert(
        courses.map((c) => ({
          path_id: newPathRow.id,
          course_id: c.course_id,
          order_num: c.order_num,
        })),
      );
    }

    // 6. Duplicate materials
    const { data: materialsRaw } = await admin
      .from('learning_path_materials')
      .select('title, url, material_type, order_num')
      .eq('path_id', params.pathId)
      .order('order_num', { ascending: true });

    const materials = (materialsRaw ?? []) as { title: string; url: string; material_type: string; order_num: number }[];

    if (materials.length > 0) {
      await admin.from('learning_path_materials').insert(
        materials.map((m) => ({
          path_id: newPathRow.id,
          title: m.title,
          url: m.url,
          material_type: m.material_type,
          order_num: m.order_num,
        })),
      );
    }

    revalidatePath('/admin/learning-paths');
    return NextResponse.json({ success: true, path: newPathRow });
  } catch (err) {
    console.error('Duplicate learning-path error:', err);
    return NextResponse.json({ error: 'Errore nella duplicazione del percorso.' } satisfies ApiError, { status: 500 });
  }
}
