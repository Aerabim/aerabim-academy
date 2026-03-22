import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createMuxUploadUrl } from '@/lib/mux/helpers';

interface UploadRequestBody {
  lessonId: string;
  courseId: string;
}

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Autenticazione richiesta' },
        { status: 401 },
      );
    }

    // 2. Admin role check via profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accesso riservato agli amministratori' },
        { status: 403 },
      );
    }

    // 3. Validate request body
    const body = await request.json() as UploadRequestBody;

    if (!body.lessonId || !body.courseId) {
      return NextResponse.json(
        { error: 'lessonId e courseId sono obbligatori' },
        { status: 400 },
      );
    }

    // 4. Create Mux Direct Upload
    const { uploadUrl, uploadId } = await createMuxUploadUrl(
      body.lessonId,
      body.courseId,
    );

    return NextResponse.json({ uploadUrl, uploadId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore durante la creazione dell\'upload';
    console.error('[mux/upload]', message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
