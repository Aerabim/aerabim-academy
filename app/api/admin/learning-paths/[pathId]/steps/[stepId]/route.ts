import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, UpdateLearningPathStepPayload } from '@/types';

interface RouteParams {
  params: { pathId: string; stepId: string };
}

/** PATCH /api/admin/learning-paths/[pathId]/steps/[stepId] — update a step */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { pathId, stepId } = params;
    const body = (await req.json()) as UpdateLearningPathStepPayload;

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined)        updateData.title         = body.title;
    if (body.description !== undefined)  updateData.description   = body.description;
    if (body.isRequired !== undefined)   updateData.is_required   = body.isRequired;
    if (body.materialUrl !== undefined)  updateData.material_url  = body.materialUrl;
    if (body.materialType !== undefined) updateData.material_type = body.materialType;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nessun campo da aggiornare.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const { data: step, error } = await admin
      .from('learning_path_steps')
      .update(updateData)
      .eq('id', stepId)
      .eq('path_id', pathId)
      .select('id')
      .single();

    if (error || !step) {
      console.error('Update step error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento del passo.' } satisfies ApiError,
        { status: 500 },
      );
    }

    revalidatePath(`/admin/learning-paths/${pathId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/admin/learning-paths/[pathId]/steps/[stepId] error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/learning-paths/[pathId]/steps/[stepId] — remove a step */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { pathId, stepId } = params;

    const { error } = await admin
      .from('learning_path_steps')
      .delete()
      .eq('id', stepId)
      .eq('path_id', pathId);

    if (error) {
      console.error('Delete step error:', error);
      return NextResponse.json(
        { error: 'Errore durante la rimozione del passo.' } satisfies ApiError,
        { status: 500 },
      );
    }

    revalidatePath(`/admin/learning-paths/${pathId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/learning-paths/[pathId]/steps/[stepId] error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
