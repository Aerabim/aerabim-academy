import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

type ItemType = 'course' | 'resource' | 'path' | 'session' | 'article';

const COLUMN: Record<ItemType, string> = {
  course:   'course_id',
  resource: 'resource_id',
  path:     'path_id',
  session:  'session_id',
  article:  'article_id',
};

/** GET /api/favorites — list user's favorite IDs grouped by type */
export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const db = supabase as unknown as SupabaseClient;
    const { data, error } = await db
      .from('favorites')
      .select('course_id, resource_id, path_id, session_id, article_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      return NextResponse.json({ error: 'Errore nel caricamento dei preferiti' }, { status: 500 });
    }

    type FavRow = { course_id: string | null; resource_id: string | null; path_id: string | null; session_id: string | null; article_id: string | null };
    const rows = (data ?? []) as FavRow[];

    return NextResponse.json({
      courseIds:   rows.filter((r) => r.course_id).map((r) => r.course_id!),
      resourceIds: rows.filter((r) => r.resource_id).map((r) => r.resource_id!),
      pathIds:     rows.filter((r) => r.path_id).map((r) => r.path_id!),
      sessionIds:  rows.filter((r) => r.session_id).map((r) => r.session_id!),
      articleIds:  rows.filter((r) => r.article_id).map((r) => r.article_id!),
    });
  } catch (err) {
    console.error('Favorites GET error:', err);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

/** POST /api/favorites — toggle a favorite (add or remove)
 *
 * Body (new format):  { itemType: 'course'|'resource'|'path'|'session', itemId: string }
 * Body (legacy):      { courseId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await req.json() as { itemType?: ItemType; itemId?: string; courseId?: string };

    // Resolve item type + id (support legacy courseId format)
    let itemType: ItemType;
    let itemId: string;

    if (body.courseId) {
      itemType = 'course';
      itemId = body.courseId;
    } else if (body.itemType && body.itemId) {
      itemType = body.itemType;
      itemId = body.itemId;
    } else {
      return NextResponse.json({ error: 'itemType e itemId richiesti' }, { status: 400 });
    }

    const column = COLUMN[itemType];
    const db = supabase as unknown as SupabaseClient;

    // Check if already favorited
    const { data: existing } = await db
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq(column, itemId)
      .maybeSingle();

    if (existing) {
      const { error } = await db.from('favorites').delete().eq('id', existing.id);
      if (error) {
        console.error('Error removing favorite:', error);
        return NextResponse.json({ error: 'Errore nella rimozione' }, { status: 500 });
      }
      return NextResponse.json({ favorited: false });
    } else {
      const { error } = await db
        .from('favorites')
        .insert({ user_id: user.id, [column]: itemId });
      if (error) {
        console.error('Error adding favorite:', error);
        return NextResponse.json({ error: "Errore nell'aggiunta" }, { status: 500 });
      }
      return NextResponse.json({ favorited: true });
    }
  } catch (err) {
    console.error('Favorites POST error:', err);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
