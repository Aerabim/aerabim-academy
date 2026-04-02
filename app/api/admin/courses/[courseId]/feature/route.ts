import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { courseId: string };
}

/** POST /api/admin/courses/[courseId]/feature — imposta il corso come "in evidenza" */
export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { courseId } = params;

    // Verifica che il corso esista
    const { data: course, error: fetchError } = await admin
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .single();

    if (fetchError || !course) {
      return NextResponse.json(
        { error: 'Corso non trovato.' } satisfies ApiError,
        { status: 404 },
      );
    }

    // Prima deseleziona tutti (evita conflitto con il partial unique index)
    const { error: clearError } = await admin
      .from('courses')
      .update({ is_featured: false })
      .eq('is_featured', true);

    if (clearError) {
      return NextResponse.json(
        { error: 'Errore durante la deselezione del corso precedente.' } satisfies ApiError,
        { status: 500 },
      );
    }

    // Poi imposta il nuovo corso come featured
    const { error: setError } = await admin
      .from('courses')
      .update({ is_featured: true })
      .eq('id', courseId);

    if (setError) {
      return NextResponse.json(
        { error: 'Errore durante l\'impostazione del corso in evidenza.' } satisfies ApiError,
        { status: 500 },
      );
    }

    revalidatePath('/catalogo-corsi');
    revalidatePath('/admin/corsi');

    return NextResponse.json({ success: true, courseId });
  } catch {
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/courses/[courseId]/feature — rimuove il corso dall'evidenza */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { courseId } = params;

    const { error } = await admin
      .from('courses')
      .update({ is_featured: false })
      .eq('id', courseId);

    if (error) {
      return NextResponse.json(
        { error: 'Errore durante la rimozione dall\'evidenza.' } satisfies ApiError,
        { status: 500 },
      );
    }

    revalidatePath('/catalogo-corsi');
    revalidatePath('/admin/corsi');

    return NextResponse.json({ success: true, courseId });
  } catch {
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
