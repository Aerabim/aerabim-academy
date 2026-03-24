import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/** GET /api/favorites — list user's favorite course IDs */
export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('course_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      return NextResponse.json({ error: 'Errore nel caricamento dei preferiti' }, { status: 500 });
    }

    const courseIds = (data ?? []).map((f: { course_id: string }) => f.course_id);
    return NextResponse.json({ courseIds });
  } catch (err) {
    console.error('Favorites GET error:', err);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

/** POST /api/favorites — toggle a course favorite (add or remove) */
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await req.json() as { courseId?: string };
    if (!body.courseId) {
      return NextResponse.json({ error: 'courseId richiesto' }, { status: 400 });
    }

    const { courseId } = body;

    // Use untyped client for favorites table (not yet in generated types)
    const db = supabase as unknown as SupabaseClient;

    // Check if already favorited
    const { data: existing } = await db
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existing) {
      // Remove
      const { error } = await db
        .from('favorites')
        .delete()
        .eq('id', existing.id);

      if (error) {
        console.error('Error removing favorite:', error);
        return NextResponse.json({ error: 'Errore nella rimozione' }, { status: 500 });
      }

      return NextResponse.json({ favorited: false });
    } else {
      // Add
      const { error } = await db
        .from('favorites')
        .insert({ user_id: user.id, course_id: courseId });

      if (error) {
        console.error('Error adding favorite:', error);
        return NextResponse.json({ error: 'Errore nell\'aggiunta' }, { status: 500 });
      }

      return NextResponse.json({ favorited: true });
    }
  } catch (err) {
    console.error('Favorites POST error:', err);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
