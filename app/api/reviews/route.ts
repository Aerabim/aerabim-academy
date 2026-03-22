import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hasActiveEnrollment } from '@/lib/reviews/queries';
import type { ApiError, CreateReviewPayload } from '@/types';

// ── GET: List reviews for a course ──────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Devi effettuare il login.' } satisfies ApiError,
        { status: 401 },
      );
    }

    const courseId = req.nextUrl.searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json(
        { error: 'Parametro courseId mancante.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const { data: rawReviews, error } = await supabase
      .from('course_reviews')
      .select('id, user_id, course_id, rating, title, body, created_at')
      .eq('course_id', courseId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch reviews error:', error);
      return NextResponse.json(
        { error: 'Errore nel caricamento delle recensioni.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ reviews: rawReviews ?? [] });
  } catch (err) {
    console.error('Reviews GET error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

// ── POST: Create or update a review ─────────────────────

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Devi effettuare il login.' } satisfies ApiError,
        { status: 401 },
      );
    }

    const body = (await req.json()) as CreateReviewPayload;

    // Validate required fields
    if (!body.courseId) {
      return NextResponse.json(
        { error: 'Corso non specificato.' } satisfies ApiError,
        { status: 400 },
      );
    }

    if (!body.rating || body.rating < 1 || body.rating > 5 || !Number.isInteger(body.rating)) {
      return NextResponse.json(
        { error: 'Valutazione non valida. Inserisci un valore da 1 a 5.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Verify active enrollment (server-side check)
    const enrolled = await hasActiveEnrollment(supabase, user.id, body.courseId);
    if (!enrolled) {
      return NextResponse.json(
        { error: 'Puoi recensire solo i corsi che hai acquistato.' } satisfies ApiError,
        { status: 403 },
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Errore di configurazione server.' } satisfies ApiError,
        { status: 500 },
      );
    }

    // Check if user already has a review for this course
    const { data: existingRaw } = await admin
      .from('course_reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', body.courseId)
      .maybeSingle();

    const existing = existingRaw as { id: string } | null;

    if (existing) {
      // Update existing review
      const { error: updateError } = await admin
        .from('course_reviews')
        .update({
          rating: body.rating,
          title: body.title?.trim() || null,
          body: body.body?.trim() || null,
          is_deleted: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Update review error:', updateError);
        return NextResponse.json(
          { error: 'Errore durante l\'aggiornamento della recensione.' } satisfies ApiError,
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true, reviewId: existing.id });
    }

    // Insert new review
    const { data: rawReview, error: insertError } = await admin
      .from('course_reviews')
      .insert({
        user_id: user.id,
        course_id: body.courseId,
        rating: body.rating,
        title: body.title?.trim() || null,
        body: body.body?.trim() || null,
      })
      .select('id')
      .single();

    if (insertError || !rawReview) {
      console.error('Insert review error:', insertError);
      return NextResponse.json(
        { error: 'Errore durante la creazione della recensione.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const review = rawReview as { id: string };
    return NextResponse.json({ success: true, reviewId: review.id });
  } catch (err) {
    console.error('Review POST error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
