import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, UpdateLearningPathPayload } from '@/types';

interface RouteParams {
  params: { pathId: string };
}

/** PATCH /api/admin/learning-paths/[pathId] — update path metadata */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { pathId } = params;
    const body = (await req.json()) as UpdateLearningPathPayload;

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined)         updateData.title          = body.title;
    if (body.subtitle !== undefined)      updateData.subtitle       = body.subtitle;
    if (body.description !== undefined)   updateData.description    = body.description;
    if (body.thumbnailUrl !== undefined)  updateData.thumbnail_url  = body.thumbnailUrl;
    if (body.level !== undefined)         updateData.level          = body.level;
    if (body.targetRole !== undefined)    updateData.target_role    = body.targetRole;
    if (body.estimatedHours !== undefined) updateData.estimated_hours = body.estimatedHours;
    if (body.orderNum !== undefined)      updateData.order_num      = body.orderNum;
    if (body.isPublished !== undefined)   updateData.is_published   = body.isPublished;

    if (body.slug !== undefined) {
      if (!/^[a-z0-9-]+$/.test(body.slug)) {
        return NextResponse.json(
          { error: 'Lo slug può contenere solo lettere minuscole, numeri e trattini.' } satisfies ApiError,
          { status: 400 },
        );
      }
      // Check slug uniqueness (exclude current path)
      const { data: existing } = await admin
        .from('learning_paths')
        .select('id')
        .eq('slug', body.slug)
        .neq('id', pathId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: 'Slug già in uso da un altro percorso.' } satisfies ApiError,
          { status: 409 },
        );
      }
      updateData.slug = body.slug;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nessun campo da aggiornare.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const { data: path, error } = await admin
      .from('learning_paths')
      .update(updateData)
      .eq('id', pathId)
      .select('id, slug, title, is_published')
      .single();

    if (error || !path) {
      console.error('Update learning_path error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento del percorso.' } satisfies ApiError,
        { status: 500 },
      );
    }

    revalidatePath('/admin/learning-paths');
    revalidatePath(`/admin/learning-paths/${pathId}`);
    return NextResponse.json({ path });
  } catch (err) {
    console.error('PATCH /api/admin/learning-paths/[pathId] error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/learning-paths/[pathId] — delete a path and all its steps */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { pathId } = params;

    // Steps are deleted via ON DELETE CASCADE on learning_path_steps.path_id
    const { error } = await admin
      .from('learning_paths')
      .delete()
      .eq('id', pathId);

    if (error) {
      console.error('Delete learning_path error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'eliminazione del percorso.' } satisfies ApiError,
        { status: 500 },
      );
    }

    revalidatePath('/admin/learning-paths');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/learning-paths/[pathId] error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
