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
 * - A course is "completed" when ALL lessons in that course are marked
 *   completed in the `progress` table for this user.
 * - percentage = completedCourses / totalCourses * 100
 * - isCompleted = completedCourses === totalCourses (and totalCourses > 0)
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

    // 1. Fetch courses in this path
    const { data: pathCoursesData, error: pcError } = await admin
      .from('learning_path_courses')
      .select('course_id')
      .eq('path_id', pathId);

    if (pcError) {
      return NextResponse.json(
        { error: 'Errore nel caricamento dei corsi del percorso.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const courseIds = ((pathCoursesData ?? []) as { course_id: string }[]).map((r) => r.course_id);
    const totalCourses = courseIds.length;

    if (totalCourses === 0) {
      const empty: LearningPathProgressData = {
        pathId,
        totalCourses: 0,
        completedCourses: 0,
        percentage: 0,
        isCompleted: false,
      };
      return NextResponse.json({ progress: empty });
    }

    // 2. Fetch all modules for these courses
    const { data: modulesData } = await admin
      .from('modules')
      .select('id, course_id')
      .in('course_id', courseIds);

    const modules = (modulesData ?? []) as { id: string; course_id: string }[];
    const moduleIds = modules.map((m) => m.id);

    // 3. Fetch all lessons for these modules
    const { data: lessonsData } = moduleIds.length > 0
      ? await admin.from('lessons').select('id, module_id').in('module_id', moduleIds)
      : { data: [] };

    const lessons = (lessonsData ?? []) as { id: string; module_id: string }[];

    // 4. Fetch completed lesson progress for this user
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

    // 5. Build module → course lookup, count lessons per course
    const moduleToCourse = new Map(modules.map((m) => [m.id, m.course_id]));
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

    // 6. A course is complete when all its lessons are completed
    let completedCourses = 0;
    for (const courseId of courseIds) {
      const total = totalByCourse.get(courseId) ?? 0;
      const completed = completedByCourse.get(courseId) ?? 0;
      if (total > 0 && completed >= total) completedCourses++;
    }

    const percentage = Math.round((completedCourses / totalCourses) * 100);
    const isCompleted = completedCourses === totalCourses;

    // 7. Update learning_path_progress if path is now completed
    if (isCompleted) {
      const { data: existing } = await admin
        .from('learning_path_progress')
        .select('id, is_completed')
        .eq('user_id', user.id)
        .eq('path_id', pathId)
        .maybeSingle();

      const now = new Date().toISOString();
      if (existing) {
        if (!existing.is_completed) {
          await admin
            .from('learning_path_progress')
            .update({ is_completed: true, completed_at: now })
            .eq('user_id', user.id)
            .eq('path_id', pathId);
        }
      } else {
        await admin
          .from('learning_path_progress')
          .insert({ user_id: user.id, path_id: pathId, is_completed: true, completed_at: now });
      }
    }

    const progress: LearningPathProgressData = {
      pathId,
      totalCourses,
      completedCourses,
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
