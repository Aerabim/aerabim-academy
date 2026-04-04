import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { ApiError, MarkStepCompleteResponse } from '@/types';

interface RouteParams {
  params: { pathId: string; stepId: string };
}

/**
 * POST /api/learning-paths/[pathId]/steps/[stepId]/complete
 *
 * Marks a video or material step as completed for the authenticated user.
 * Course-step completion is computed automatically from lesson progress —
 * this endpoint is only for dedicated (video/material) steps.
 *
 * After marking the step, checks whether all required steps in the path
 * are now complete and updates learning_path_progress.is_completed accordingly.
 */
export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Devi effettuare il login.' } satisfies ApiError,
        { status: 401 },
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Configurazione server incompleta.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const { pathId, stepId } = params;

    // 1. Verify the step exists, belongs to this path, and is video/material
    const { data: stepRow } = await admin
      .from('learning_path_steps')
      .select('id, step_type, is_required')
      .eq('id', stepId)
      .eq('path_id', pathId)
      .maybeSingle();

    const step = stepRow as { id: string; step_type: string; is_required: boolean } | null;

    if (!step) {
      return NextResponse.json(
        { error: 'Passo non trovato.' } satisfies ApiError,
        { status: 404 },
      );
    }

    if (step.step_type === 'course') {
      return NextResponse.json(
        { error: 'Il completamento dei corsi è automatico. Usa l\'endpoint progress lezione.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // 2. Fetch or initialise the learning_path_progress row
    const { data: existing } = await admin
      .from('learning_path_progress')
      .select('id, completed_step_ids')
      .eq('user_id', user.id)
      .eq('path_id', pathId)
      .maybeSingle();

    const lpp = existing as { id: string; completed_step_ids: string[] } | null;
    const currentIds: string[] = lpp?.completed_step_ids ?? [];

    // Idempotent: skip if already marked complete
    if (!currentIds.includes(stepId)) {
      const updatedIds = [...currentIds, stepId];

      if (lpp) {
        await admin
          .from('learning_path_progress')
          .update({ completed_step_ids: updatedIds, updated_at: new Date().toISOString() })
          .eq('id', lpp.id);
      } else {
        await admin
          .from('learning_path_progress')
          .insert({
            user_id: user.id,
            path_id: pathId,
            completed_step_ids: updatedIds,
            is_completed: false,
          });
      }
    }

    // 3. Check if all required steps are now complete
    const { data: allStepsData } = await admin
      .from('learning_path_steps')
      .select('id, step_type, course_id, is_required')
      .eq('path_id', pathId);

    const allSteps = (allStepsData ?? []) as {
      id: string; step_type: string; course_id: string | null; is_required: boolean;
    }[];

    const requiredSteps = allSteps.filter((s) => s.is_required);

    // Fetch updated completed_step_ids
    const { data: updatedLpp } = await admin
      .from('learning_path_progress')
      .select('completed_step_ids')
      .eq('user_id', user.id)
      .eq('path_id', pathId)
      .single();

    const completedDedicatedIds = new Set<string>(
      (updatedLpp as { completed_step_ids: string[] } | null)?.completed_step_ids ?? [],
    );

    // For course steps, compute completion from lesson progress
    const courseSteps = requiredSteps.filter((s) => s.step_type === 'course' && s.course_id);
    const completedCourseStepIds = new Set<string>();

    if (courseSteps.length > 0) {
      const courseIds = courseSteps.map((s) => s.course_id!);
      const { data: modulesData } = await admin
        .from('modules').select('id, course_id').in('course_id', courseIds);
      const modules = (modulesData ?? []) as { id: string; course_id: string }[];
      const moduleIds = modules.map((m) => m.id);

      const { data: lessonsData } = moduleIds.length > 0
        ? await admin.from('lessons').select('id, module_id').in('module_id', moduleIds)
        : { data: [] };
      const lessons = (lessonsData ?? []) as { id: string; module_id: string }[];
      const lessonIds = lessons.map((l) => l.id);

      const { data: progressData } = lessonIds.length > 0
        ? await admin.from('progress').select('lesson_id')
            .eq('user_id', user.id).eq('completed', true).in('lesson_id', lessonIds)
        : { data: [] };

      const completedLessonIds = new Set(
        ((progressData ?? []) as { lesson_id: string }[]).map((p) => p.lesson_id),
      );
      const moduleToCourse = new Map(modules.map((m) => [m.id, m.course_id]));
      const totalByCourse = new Map<string, number>();
      const completedByCourse = new Map<string, number>();
      for (const l of lessons) {
        const cId = moduleToCourse.get(l.module_id);
        if (!cId) continue;
        totalByCourse.set(cId, (totalByCourse.get(cId) ?? 0) + 1);
        if (completedLessonIds.has(l.id)) {
          completedByCourse.set(cId, (completedByCourse.get(cId) ?? 0) + 1);
        }
      }
      for (const s of courseSteps) {
        const total = totalByCourse.get(s.course_id!) ?? 0;
        const completed = completedByCourse.get(s.course_id!) ?? 0;
        if (total > 0 && completed >= total) completedCourseStepIds.add(s.id);
      }
    }

    const allRequiredDone = requiredSteps.every((s) => {
      if (s.step_type === 'course') return completedCourseStepIds.has(s.id);
      return completedDedicatedIds.has(s.id);
    });

    // 4. If all required steps complete, mark the path as completed
    if (allRequiredDone) {
      await admin
        .from('learning_path_progress')
        .update({ is_completed: true, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('path_id', pathId);
    }

    return NextResponse.json(
      { success: true, isPathCompleted: allRequiredDone } satisfies MarkStepCompleteResponse,
    );
  } catch (err) {
    console.error('POST /api/learning-paths/[pathId]/steps/[stepId]/complete error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
