import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, AddLearningPathMaterialPayload, LearningPathMaterial } from '@/types';

interface RouteParams {
  params: { pathId: string };
}

/** GET /api/admin/learning-paths/[pathId]/materials — list materials */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { pathId } = params;

    const { data, error } = await admin
      .from('learning_path_materials')
      .select('id, path_id, title, url, material_type, order_num, created_at')
      .eq('path_id', pathId)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('GET learning_path_materials error:', error);
      return NextResponse.json(
        { error: 'Errore nel caricamento dei materiali.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const materials: LearningPathMaterial[] = ((data ?? []) as {
      id: string; path_id: string; title: string; url: string;
      material_type: 'pdf' | 'link'; order_num: number; created_at: string;
    }[]).map((m) => ({
      id: m.id,
      pathId: m.path_id,
      title: m.title,
      url: m.url,
      materialType: m.material_type,
      orderNum: m.order_num,
      createdAt: m.created_at,
    }));

    return NextResponse.json({ materials });
  } catch (err) {
    console.error('GET /api/admin/learning-paths/[pathId]/materials error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** POST /api/admin/learning-paths/[pathId]/materials — add a material */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { pathId } = params;
    const body = (await req.json()) as AddLearningPathMaterialPayload;

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Il titolo del materiale è obbligatorio.' } satisfies ApiError,
        { status: 400 },
      );
    }
    if (!body.url?.trim()) {
      return NextResponse.json(
        { error: 'L\'URL del materiale è obbligatorio.' } satisfies ApiError,
        { status: 400 },
      );
    }
    if (!body.materialType || !['pdf', 'link'].includes(body.materialType)) {
      return NextResponse.json(
        { error: 'materialType deve essere "pdf" o "link".' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Verify path exists
    const { data: pathRow } = await admin
      .from('learning_paths')
      .select('id')
      .eq('id', pathId)
      .maybeSingle();

    if (!pathRow) {
      return NextResponse.json(
        { error: 'Percorso non trovato.' } satisfies ApiError,
        { status: 404 },
      );
    }

    // Compute next order_num
    const { data: last } = await admin
      .from('learning_path_materials')
      .select('order_num')
      .eq('path_id', pathId)
      .order('order_num', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = ((last as { order_num: number } | null)?.order_num ?? 0) + 1;

    const { data: material, error: insertErr } = await admin
      .from('learning_path_materials')
      .insert({
        path_id: pathId,
        title: body.title.trim(),
        url: body.url.trim(),
        material_type: body.materialType,
        order_num: nextOrder,
      })
      .select('id, path_id, title, url, material_type, order_num, created_at')
      .single();

    if (insertErr || !material) {
      console.error('Insert learning_path_materials error:', insertErr);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiunta del materiale.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const m = material as {
      id: string; path_id: string; title: string; url: string;
      material_type: 'pdf' | 'link'; order_num: number; created_at: string;
    };

    const result2: LearningPathMaterial = {
      id: m.id,
      pathId: m.path_id,
      title: m.title,
      url: m.url,
      materialType: m.material_type,
      orderNum: m.order_num,
      createdAt: m.created_at,
    };

    revalidatePath(`/admin/learning-paths/${pathId}`);
    return NextResponse.json({ material: result2 }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/learning-paths/[pathId]/materials error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
