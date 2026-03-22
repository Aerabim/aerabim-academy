import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  getCourseIdForLesson,
  verifyEnrollment,
  getQuizQuestionsWithAnswers,
} from '@/lib/learn/queries';
import type { QuizSubmitRequest, QuizSubmitResponse, ApiError } from '@/types';

const PASS_THRESHOLD = 0.7; // 70% to pass

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

    // 2. Parse body
    const body = (await req.json()) as QuizSubmitRequest;
    if (!body.lessonId || !Array.isArray(body.answers)) {
      return NextResponse.json(
        { error: 'Dati del quiz non validi.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // 3. Verify enrollment
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

    // 4. Get questions with correct answers (server-side)
    const questions = await getQuizQuestionsWithAnswers(supabase, body.lessonId);
    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'Nessuna domanda trovata per questo quiz.' } satisfies ApiError,
        { status: 404 },
      );
    }

    // 5. Grade the quiz
    const answerMap = new Map(body.answers.map((a) => [a.questionId, a.selectedIndex]));
    let correctCount = 0;
    const correctAnswers: Record<string, number> = {};

    for (const question of questions) {
      const correctIndex = question.options.findIndex((o) => o.is_correct);
      correctAnswers[question.id] = correctIndex;

      const userAnswer = answerMap.get(question.id);
      if (userAnswer === correctIndex) {
        correctCount++;
      }
    }

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= PASS_THRESHOLD * 100;

    // 6. Save attempt via admin client
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Configurazione server incompleta.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const { error: insertError } = await admin
      .from('quiz_attempts')
      .insert({
        user_id: user.id,
        lesson_id: body.lessonId,
        answers: Object.fromEntries(answerMap),
        score,
        passed,
      });

    if (insertError) {
      return NextResponse.json(
        { error: 'Errore nel salvataggio del tentativo.' } satisfies ApiError,
        { status: 500 },
      );
    }

    // 7. If passed, also mark the lesson as completed in progress
    if (passed) {
      await admin
        .from('progress')
        .upsert(
          {
            user_id: user.id,
            lesson_id: body.lessonId,
            completed: true,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,lesson_id' },
        );
    }

    return NextResponse.json({
      success: true,
      score,
      total: questions.length,
      passed,
      correctAnswers,
    } satisfies QuizSubmitResponse);
  } catch {
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
