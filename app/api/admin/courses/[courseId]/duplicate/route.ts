import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

export async function POST(
  _request: Request,
  { params }: { params: { courseId: string } },
) {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;

  const { admin } = auth;

  try {
    // 1. Fetch original course
    const { data: original, error: courseErr } = await admin
      .from('courses')
      .select('*')
      .eq('id', params.courseId)
      .single();

    if (courseErr || !original) {
      return NextResponse.json({ error: 'Corso non trovato.' } satisfies ApiError, { status: 404 });
    }

    const course = original as Record<string, unknown>;

    // 2. Generate unique slug
    let newSlug = `${course.slug}-copia`;
    let slugCounter = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: existing } = await admin
        .from('courses')
        .select('id')
        .eq('slug', newSlug)
        .maybeSingle();
      if (!existing) break;
      slugCounter++;
      newSlug = `${course.slug}-copia-${slugCounter}`;
    }

    // 3. Create new course (draft, no stripe_price_id)
    const { data: newCourse, error: insertErr } = await admin
      .from('courses')
      .insert({
        title: `${course.title} (Copia)`,
        slug: newSlug,
        description: course.description,
        area: course.area,
        level: course.level,
        price_single: course.price_single,
        is_free: course.is_free,
        thumbnail_url: course.thumbnail_url,
        status: 'draft',
        stripe_price_id: null,
      })
      .select('id, slug, title')
      .single();

    if (insertErr || !newCourse) {
      console.error('Insert course error:', insertErr);
      return NextResponse.json({ error: 'Errore nella duplicazione del corso.' } satisfies ApiError, { status: 500 });
    }

    const newCourseRow = newCourse as { id: string; slug: string; title: string };

    // 4. Fetch and duplicate modules
    const { data: modulesRaw } = await admin
      .from('modules')
      .select('id, title, order_num')
      .eq('course_id', params.courseId)
      .order('order_num', { ascending: true });

    const modules = (modulesRaw ?? []) as { id: string; title: string; order_num: number }[];
    const moduleIdMap = new Map<string, string>();

    for (const mod of modules) {
      const { data: newMod } = await admin
        .from('modules')
        .insert({
          course_id: newCourseRow.id,
          title: mod.title,
          order_num: mod.order_num,
        })
        .select('id')
        .single();

      if (newMod) {
        moduleIdMap.set(mod.id, (newMod as { id: string }).id);
      }
    }

    // 5. Fetch and duplicate lessons
    const oldModuleIds = modules.map((m) => m.id);
    if (oldModuleIds.length > 0) {
      const { data: lessonsRaw } = await admin
        .from('lessons')
        .select('id, module_id, title, order_num, type, is_preview, material_url')
        .in('module_id', oldModuleIds)
        .order('order_num', { ascending: true });

      const lessons = (lessonsRaw ?? []) as {
        id: string; module_id: string; title: string; order_num: number;
        type: string; is_preview: boolean; material_url: string | null;
      }[];

      const lessonIdMap = new Map<string, string>();

      for (const lesson of lessons) {
        const newModuleId = moduleIdMap.get(lesson.module_id);
        if (!newModuleId) continue;

        const { data: newLesson } = await admin
          .from('lessons')
          .insert({
            module_id: newModuleId,
            title: lesson.title,
            order_num: lesson.order_num,
            type: lesson.type,
            is_preview: lesson.is_preview,
            material_url: lesson.material_url,
            mux_playback_id: null,
            mux_asset_id: null,
            mux_status: 'waiting',
            duration_sec: null,
          })
          .select('id')
          .single();

        if (newLesson) {
          lessonIdMap.set(lesson.id, (newLesson as { id: string }).id);
        }
      }

      // 6. Duplicate quiz questions
      const quizLessonIds = lessons.filter((l) => l.type === 'quiz').map((l) => l.id);
      if (quizLessonIds.length > 0) {
        const { data: questionsRaw } = await admin
          .from('quiz_questions')
          .select('lesson_id, question, options, correct_option, order_num')
          .in('lesson_id', quizLessonIds)
          .order('order_num', { ascending: true });

        const questions = (questionsRaw ?? []) as {
          lesson_id: string; question: string; options: string[];
          correct_option: number; order_num: number;
        }[];

        for (const q of questions) {
          const newLessonId = lessonIdMap.get(q.lesson_id);
          if (!newLessonId) continue;

          await admin
            .from('quiz_questions')
            .insert({
              lesson_id: newLessonId,
              question: q.question,
              options: q.options,
              correct_option: q.correct_option,
              order_num: q.order_num,
            });
        }
      }
    }

    revalidatePath('/admin/corsi');
    return NextResponse.json({
      success: true,
      course: newCourseRow,
    });
  } catch (err) {
    console.error('Duplicate course error:', err);
    return NextResponse.json({ error: 'Errore nella duplicazione del corso.' } satisfies ApiError, { status: 500 });
  }
}
