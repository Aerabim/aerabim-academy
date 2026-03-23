import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { courseId: string; lessonId: string };
}

/** GET /api/admin/courses/[courseId]/lessons/[lessonId]/quiz — list quiz questions */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { data, error } = await admin
      .from('quiz_questions')
      .select('id, lesson_id, question, options, correct_index, explanation, order_num')
      .eq('lesson_id', params.lessonId)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('List quiz questions error:', error);
      return NextResponse.json(
        { error: 'Errore nel recupero delle domande.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ questions: data ?? [] });
  } catch (err) {
    console.error('GET quiz error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** POST /api/admin/courses/[courseId]/lessons/[lessonId]/quiz — create question */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = await req.json();

    if (!body.question || !body.options || body.correctIndex === undefined) {
      return NextResponse.json(
        { error: 'Campi obbligatori: question, options, correctIndex.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Get next order_num
    const { data: last } = await admin
      .from('quiz_questions')
      .select('order_num')
      .eq('lesson_id', params.lessonId)
      .order('order_num', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = ((last as { order_num: number } | null)?.order_num ?? 0) + 1;

    const { data: question, error } = await admin
      .from('quiz_questions')
      .insert({
        lesson_id: params.lessonId,
        question: body.question,
        options: body.options,
        correct_index: body.correctIndex,
        explanation: body.explanation ?? null,
        order_num: nextOrder,
      })
      .select('id, lesson_id, question, options, correct_index, explanation, order_num')
      .single();

    if (error || !question) {
      console.error('Insert quiz question error:', error);
      return NextResponse.json(
        { error: 'Errore durante la creazione della domanda.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ question }, { status: 201 });
  } catch (err) {
    console.error('POST quiz error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** PATCH /api/admin/courses/[courseId]/lessons/[lessonId]/quiz — update or reorder questions */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = await req.json();

    // Reorder mode: { items: [{ id, orderNum }] }
    if (body.items && Array.isArray(body.items)) {
      const updates = body.items.map((item: { id: string; orderNum: number }) =>
        admin
          .from('quiz_questions')
          .update({ order_num: item.orderNum })
          .eq('id', item.id)
          .eq('lesson_id', params.lessonId),
      );
      await Promise.all(updates);
      return NextResponse.json({ success: true });
    }

    // Single question update: { questionId, question?, options?, correctIndex?, explanation? }
    if (!body.questionId) {
      return NextResponse.json(
        { error: 'questionId obbligatorio per aggiornare una domanda.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.question !== undefined) updateData.question = body.question;
    if (body.options !== undefined) updateData.options = body.options;
    if (body.correctIndex !== undefined) updateData.correct_index = body.correctIndex;
    if (body.explanation !== undefined) updateData.explanation = body.explanation;

    const { data: question, error } = await admin
      .from('quiz_questions')
      .update(updateData)
      .eq('id', body.questionId)
      .eq('lesson_id', params.lessonId)
      .select('id, question, options, correct_index, explanation, order_num')
      .single();

    if (error || !question) {
      console.error('Update quiz question error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento della domanda.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ question });
  } catch (err) {
    console.error('PATCH quiz error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/courses/[courseId]/lessons/[lessonId]/quiz — delete a question */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json(
        { error: 'questionId obbligatorio come query parameter.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const { error } = await admin
      .from('quiz_questions')
      .delete()
      .eq('id', questionId)
      .eq('lesson_id', params.lessonId);

    if (error) {
      console.error('Delete quiz question error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'eliminazione della domanda.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE quiz error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
