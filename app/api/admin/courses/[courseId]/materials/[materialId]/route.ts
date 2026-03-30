import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { courseId: string; materialId: string };
}

/** PATCH /api/admin/courses/[courseId]/materials/[materialId] — update title or order */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = String(body.title).trim();
    if (body.orderNum !== undefined) updateData.order_num = body.orderNum;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nessun campo da aggiornare.' } satisfies ApiError, { status: 400 });
    }

    const { data: material, error } = await admin
      .from('materials')
      .update(updateData)
      .eq('id', params.materialId)
      .eq('course_id', params.courseId)
      .select('id, course_id, title, file_url, file_name, file_type, file_size, order_num, created_at')
      .single();

    if (error || !material) {
      console.error('Update material error:', error);
      return NextResponse.json({ error: 'Errore durante l\'aggiornamento del materiale.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ material });
  } catch (err) {
    console.error('PATCH material error:', err);
    return NextResponse.json({ error: 'Errore interno del server.' } satisfies ApiError, { status: 500 });
  }
}

/** DELETE /api/admin/courses/[courseId]/materials/[materialId] — delete material + storage file */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    // Fetch file_url before deleting to remove from storage
    const { data: material } = await admin
      .from('materials')
      .select('file_url')
      .eq('id', params.materialId)
      .eq('course_id', params.courseId)
      .single();

    const fileUrl = (material as { file_url: string } | null)?.file_url;

    const { error } = await admin
      .from('materials')
      .delete()
      .eq('id', params.materialId)
      .eq('course_id', params.courseId);

    if (error) {
      console.error('Delete material error:', error);
      return NextResponse.json({ error: 'Errore durante l\'eliminazione del materiale.' } satisfies ApiError, { status: 500 });
    }

    // Remove from Supabase Storage — extract path from public URL
    if (fileUrl) {
      const url = new URL(fileUrl);
      // path after /storage/v1/object/public/lesson-materials/
      const storagePath = url.pathname.replace(/^\/storage\/v1\/object\/public\/lesson-materials\//, '');
      if (storagePath) {
        await admin.storage.from('lesson-materials').remove([storagePath]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE material error:', err);
    return NextResponse.json({ error: 'Errore interno del server.' } satisfies ApiError, { status: 500 });
  }
}
