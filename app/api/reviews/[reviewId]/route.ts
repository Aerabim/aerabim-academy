import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { ApiError } from '@/types';

interface RouteContext {
  params: { reviewId: string };
}

// ── DELETE: Soft-delete a review (author or admin) ──────

export async function DELETE(_req: Request, { params }: RouteContext) {
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
        { error: 'Errore di configurazione server.' } satisfies ApiError,
        { status: 500 },
      );
    }

    // Get the review
    const { data: rawReview } = await admin
      .from('course_reviews')
      .select('id, user_id')
      .eq('id', params.reviewId)
      .maybeSingle();

    const review = rawReview as { id: string; user_id: string } | null;

    if (!review) {
      return NextResponse.json(
        { error: 'Recensione non trovata.' } satisfies ApiError,
        { status: 404 },
      );
    }

    // Check permission: author or admin
    const { data: rawProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const profile = rawProfile as { role: string } | null;
    const isAdmin = profile?.role === 'admin';

    if (review.user_id !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Non hai i permessi per eliminare questa recensione.' } satisfies ApiError,
        { status: 403 },
      );
    }

    // Soft delete
    const { error: deleteError } = await admin
      .from('course_reviews')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', params.reviewId);

    if (deleteError) {
      console.error('Delete review error:', deleteError);
      return NextResponse.json(
        { error: 'Errore durante l\'eliminazione della recensione.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Review DELETE error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
