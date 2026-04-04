import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { ApiError, LearningPathProgressData } from '@/types';

interface RouteParams {
  params: { pathId: string };
}

/**
 * GET /api/learning-paths/[pathId]/progress
 *
 * Returns computed progress for the authenticated user on a given path.
 *
 * Progress logic:
 * - course step  → complete when ALL lessons in that course are marked
 *                  completed in the `progress` table
 * - video/material step → complete when stepId is in
 *                         learning_path_progress.completed_step_ids
 * Only `is_required = true` steps count toward the overall percentage.
 */
export async function GET(_req: Request, { params }: RouteParams) {
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

    const { pathId } = params;

    // 1. Fetch all steps for this path
    const { data: stepsData, error: stepsError } = await admin
      .from('learning_path_steps')
      .select('id, step_type, course_id, is_required')
      .eq('path_id', pathId);

    if (stepsError) {
      return NextResponse.json(
        { error: 'Errore nel caricamento dei passi.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const steps = (stepsData ?? []) as {
      id: string; step_type: string; course_id: string | null; is_required: boolean;
    }[];

    if (steps.length === 0) {
      const empty: LearningPathProgressData = {
        pathId,
        completedStepIds: [],
        totalRequiredSteps: 0,
        completedRequiredSteps: 0,
        percentage: 0,
        isCompleted: false,
      };
      return NextResponse.json({ progress: empty });
    }

    // 2. Fetch the user's learning_path_progress row (may not exist yet)
    const { data: lppRow } = await admin
      .from('learning_path_progress')
      .select('completed_step_ids, is_completed')
      .eq('user_id', user.id)
      .eq('path_id', pathId)
      .maybeSingle();

    const lpp = lppRow as { completed_step_ids: string[]; is_completed: boolean } | null;
    const completedDedicatedIds = new Set<string>(lpp?.completed_step_ids ?? []);

    // 3. For course-type steps: compute completion from lesson progress
    const courseSteps = steps.filter((s) => s.step_type === 'course' && s.course_id);
    const courseIds = courseSteps.map((s) => s.course_id!);

    const completedCourseStepIds = new Set<string>();

    if (courseIds.length > 0) {
      // Get all modules for these courses
      const { data: modulesData } = await admin
        .from('modules')
        .select('id, course_id')
        .in('course_id', courseIds);

      const modules = (modulesData ?? []) as { id: string; course_id: string }[];
      const moduleIds = modules.map((m) => m.id);

      // Get all lessons
      const { data: lessonsData } = moduleIds.length > 0
        ? await admin.from('lessons').select('id, module_id').in('module_id', moduleIds)
        : { data: [] };

      const lessons = (lessonsData ?? []) as { id: string; module_id: string }[];

      // Get completed lesson progress for this user
      const lessonIds = lessons.map((l) => l.id);
      const { data: progressData } = lessonIds.length > 0
        ? await admin
            .from('progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('completed', true)
            .in('lesson_id', lessonIds)
        : { data: [] };

      const completedLessonIds = new Set(
        ((progressData ?? []) as { lesson_id: string }[]).map((p) => p.lesson_id),
      );

      // Build: moduleId → courseId lookup
      const moduleToCourse = new Map(modules.map((m) => [m.id, m.course_id]));

      // Count total and completed lessons per course
      const totalByCourse = new Map<string, number>();
      const completedByCourse = new Map<string, number>();
      for (const lesson of lessons) {
        const courseId = moduleToCourse.get(lesson.module_id);
        if (!courseId) continue;
        totalByCourse.set(courseId, (totalByCourse.get(courseId) ?? 0) + 1);
        if (completedLessonIds.has(lesson.id)) {
          completedByCourse.set(courseId, (completedByCourse.get(courseId) ?? 0) + 1);
        }
      }

      // A course step is complete when all its lessons are completed
      for (const s of courseSteps) {
        const total = totalByCourse.get(s.course_id!) ?? 0;
        const completed = completedByCourse.get(s.course_id!) ?? 0;
        if (total > 0 && completed >= total) {
          completedCourseStepIds.add(s.id);
        }
      }
    }

    // 4. Compute overall progress
    const requiredSteps = steps.filter((s) => s.is_required);
    const totalRequiredSteps = requiredSteps.length;

    const completedRequiredSteps = requiredSteps.filter((s) => {
      if (s.step_type === 'course') return completedCourseStepIds.has(s.id);
      return completedDedicatedIds.has(s.id);
    }).length;

    const percentage = totalRequiredSteps > 0
      ? Math.round((completedRequiredSteps / totalRequiredSteps) * 100)
      : 0;

    const isCompleted = totalRequiredSteps > 0 && completedRequiredSteps >= totalRequiredSteps;

    const progress: LearningPathProgressData = {
      pathId,
      completedStepIds: [
        ...Array.from(completedCourseStepIds),
        ...Array.from(completedDedicatedIds),
      ],
      totalRequiredSteps,
      completedRequiredSteps,
      percentage,
      isCompleted,
    };

    return NextResponse.json({ progress });
  } catch (err) {
    console.error('GET /api/learning-paths/[pathId]/progress error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
