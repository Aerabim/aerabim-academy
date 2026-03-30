import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

const ALLOWED_TYPES = new Set([
  // Documenti
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // BIM/CAD — browser non riconosce MIME type specifici, arrivano come octet-stream
  'application/octet-stream',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-msdownload',  // .exe
]);

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'pptx', 'xlsx', 'docx',
  'rvt', 'rfa', 'nwd', 'nwc', 'dwg', 'dxf', 'ifc',
  'exe', 'zip',
]);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

interface RouteParams {
  params: { courseId: string };
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nessun file selezionato.' } satisfies ApiError, { status: 400 });
    }

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `Formato non supportato (.${ext}). Formati accettati: PDF, PPTX, XLSX, DOCX, RVT, RFA, NWD, NWC, DWG, DXF, IFC, EXE, ZIP.` } satisfies ApiError,
        { status: 400 },
      );
    }

    // Validate MIME type (only for types the browser reports correctly)
    if (file.type && !ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Tipo MIME non supportato.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File troppo grande. Dimensione massima: 100 MB.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Verify course exists
    const { data: course } = await admin
      .from('courses')
      .select('id')
      .eq('id', params.courseId)
      .single();

    if (!course) {
      return NextResponse.json({ error: 'Corso non trovato.' } satisfies ApiError, { status: 404 });
    }

    // Upload to Supabase Storage
    const storagePath = `${params.courseId}/materials/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from('lesson-materials')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Errore durante il caricamento del file.' } satisfies ApiError, { status: 500 });
    }

    const { data: urlData } = admin.storage
      .from('lesson-materials')
      .getPublicUrl(storagePath);

    return NextResponse.json({
      fileUrl: urlData.publicUrl,
      fileName: file.name,
      fileType: ext,
      fileSize: file.size,
    });
  } catch (err) {
    console.error('Upload material error:', err);
    return NextResponse.json({ error: 'Errore durante il caricamento.' } satisfies ApiError, { status: 500 });
  }
}
