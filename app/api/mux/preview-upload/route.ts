import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import { createMuxPreviewUploadUrl, createMuxPathPreviewUploadUrl } from '@/lib/mux/helpers';
import type { ApiError } from '@/types';

/** POST /api/mux/preview-upload — creates a Mux Direct Upload URL for a course or path preview clip */
export async function POST(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;

    const body = await req.json();
    const courseId = body.courseId as string | undefined;
    const pathId = body.pathId as string | undefined;

    if (pathId) {
      const { uploadUrl, uploadId } = await createMuxPathPreviewUploadUrl(pathId);
      return NextResponse.json({ uploadUrl, uploadId });
    }

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId o pathId obbligatorio.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const { uploadUrl, uploadId } = await createMuxPreviewUploadUrl(courseId);
    return NextResponse.json({ uploadUrl, uploadId });
  } catch (err) {
    console.error('POST /api/mux/preview-upload error:', err);
    return NextResponse.json(
      { error: 'Errore nella creazione dell\'upload.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
