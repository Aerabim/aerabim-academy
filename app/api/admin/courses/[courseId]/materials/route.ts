import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { courseId: string };
}

/** GET /api/admin/courses/[courseId]/materials — list materials for a course */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { data, error } = await admin
      .from('materials')
      .select('id, course_id, title, file_url, file_name, file_type, file_size, order_num, created_at')
      .eq('course_id', params.courseId)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('Get materials error:', error);
      return NextResponse.json({ error: 'Errore nel recupero dei materiali.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ materials: data ?? [] });
  } catch (err) {
    console.error('GET materials error:', err);
    return NextResponse.json({ error: 'Errore interno del server.' } satisfies ApiError, { status: 500 });
  }
}

/** POST /api/admin/courses/[courseId]/materials — create material record after upload */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = await req.json();
    const { title, fileUrl, fileName, fileType, fileSize } = body as {
      title: string;
      fileUrl: string;
      fileName: string;
      fileType: string;
      fileSize: number | null;
    };

    if (!title?.trim() || !fileUrl || !fileName || !fileType) {
      return NextResponse.json({ error: 'Dati mancanti.' } satisfies ApiError, { status: 400 });
    }

    // Get current max order_num
    const { data: existing } = await admin
      .from('materials')
      .select('order_num')
      .eq('course_id', params.courseId)
      .order('order_num', { ascending: false })
      .limit(1)
      .single();

    const orderNum = ((existing as { order_num: number } | null)?.order_num ?? 0) + 1;

    const { data: material, error } = await admin
      .from('materials')
      .insert({
        course_id: params.courseId,
        title: title.trim(),
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize ?? null,
        order_num: orderNum,
      })
      .select('id, course_id, title, file_url, file_name, file_type, file_size, order_num, created_at')
      .single();

    if (error || !material) {
      console.error('Insert material error:', error);
      return NextResponse.json({ error: 'Errore durante il salvataggio del materiale.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ material }, { status: 201 });
  } catch (err) {
    console.error('POST materials error:', err);
    return NextResponse.json({ error: 'Errore interno del server.' } satisfies ApiError, { status: 500 });
  }
}
