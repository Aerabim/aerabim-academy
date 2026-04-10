import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, UpdateLearningPathMaterialPayload } from '@/types';

interface RouteParams {
  params: { pathId: string; materialId: string };
}

/** PATCH /api/admin/learning-paths/[pathId]/materials/[materialId] — update a material */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { pathId, materialId } = params;
    const body = (await req.json()) as UpdateLearningPathMaterialPayload;

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined)        updateData.title         = body.title;
    if (body.url !== undefined)          updateData.url           = body.url;
    if (body.materialType !== undefined) updateData.material_type = body.materialType;
    if (body.orderNum !== undefined)     updateData.order_num     = body.orderNum;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nessun campo da aggiornare.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const { data: material, error } = await admin
      .from('learning_path_materials')
      .update(updateData)
      .eq('id', materialId)
      .eq('path_id', pathId)
      .select('id')
      .single();

    if (error || !material) {
      console.error('Update learning_path_materials error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento del materiale.' } satisfies ApiError,
        { status: 500 },
      );
    }

    revalidatePath(`/admin/learning-paths/${pathId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/admin/learning-paths/[pathId]/materials/[materialId] error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/learning-paths/[pathId]/materials/[materialId] — remove a material */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { pathId, materialId } = params;

    const { error } = await admin
      .from('learning_path_materials')
      .delete()
      .eq('id', materialId)
      .eq('path_id', pathId);

    if (error) {
      console.error('Delete learning_path_materials error:', error);
      return NextResponse.json(
        { error: 'Errore durante la rimozione del materiale.' } satisfies ApiError,
        { status: 500 },
      );
    }

    revalidatePath(`/admin/learning-paths/${pathId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/learning-paths/[pathId]/materials/[materialId] error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
