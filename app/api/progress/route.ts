import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { verifyEnrollment, getCourseIdForLesson } from '@/lib/learn/queries';
import type { ProgressUpdateRequest, ProgressUpdateResponse, ApiError } from '@/types';

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();

    // 1. Authenticate
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Devi effettuare il login.' } satisfies ApiError,
        { status: 401 },
      );
    }

    // 2. Parse and validate body
    const body = (await req.json()) as ProgressUpdateRequest;

    if (!body.lessonId || typeof body.lessonId !== 'string') {
      return NextResponse.json(
        { error: 'ID lezione non valido.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // 3. Find the course for this lesson and verify enrollment
    const courseId = await getCourseIdForLesson(supabase, body.lessonId);
    if (!courseId) {
      return NextResponse.json(
        { error: 'Lezione non trovata.' } satisfies ApiError,
        { status: 404 },
      );
    }

    const isEnrolled = await verifyEnrollment(supabase, user.id, courseId);
    if (!isEnrolled) {
      return NextResponse.json(
        { error: 'Non sei iscritto a questo corso.' } satisfies ApiError,
        { status: 403 },
      );
    }

    // 4. Get admin client for writing (user identity already verified above)
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Configurazione server incompleta.' } satisfies ApiError,
        { status: 500 },
      );
    }

    // 5. Build upsert data
    const upsertData: {
      user_id: string;
      lesson_id: string;
      completed?: boolean;
      completed_at?: string;
      watch_time_sec?: number;
    } = {
      user_id: user.id,
      lesson_id: body.lessonId,
    };

    if (body.completed) {
      upsertData.completed = true;
      upsertData.completed_at = new Date().toISOString();
    }

    if (body.watchTimeSec !== undefined && typeof body.watchTimeSec === 'number') {
      // Clamp to reasonable bounds (0 to 24 hours)
      upsertData.watch_time_sec = Math.max(0, Math.min(body.watchTimeSec, 86400));
    }

    // 6. Upsert progress via admin client (user verified server-side)
    const { error: upsertError } = await admin
      .from('progress')
      .upsert(upsertData, { onConflict: 'user_id,lesson_id' });

    if (upsertError) {
      return NextResponse.json(
        { error: 'Errore nel salvataggio del progresso.' } satisfies ApiError,
        { status: 500 },
      );
    }

    // 7. Check if all lessons in the course are completed (for Phase 5 certificate trigger)
    let allCompleted = false;
    if (body.completed) {
      const { data: rawModules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);

      const moduleIds = ((rawModules ?? []) as unknown as { id: string }[]).map((m) => m.id);

      const { data: rawLessons } = await supabase
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds.length > 0 ? moduleIds : ['__none__']);

      const lessonIds = ((rawLessons ?? []) as unknown as { id: string }[]).map((l) => l.id);

      const { data: completedProgress } = await supabase
        .from('progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('completed', true)
        .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['__none__']);

      const completedCount = ((completedProgress ?? []) as unknown as { lesson_id: string }[]).length;
      allCompleted = completedCount >= lessonIds.length;
    }

    return NextResponse.json(
      { success: true, allCompleted } satisfies ProgressUpdateResponse,
    );
  } catch {
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
