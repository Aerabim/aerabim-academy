import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getMuxClient } from '@/lib/mux/helpers';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

interface DeleteAssetBody {
  lessonId: string;
}

/**
 * POST /api/mux/delete-asset
 * Deletes the Mux asset associated with a lesson and resets the lesson's video fields.
 */
export async function POST(request: Request) {
  try {
    // 1. Auth + admin check
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Autenticazione richiesta' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Accesso riservato agli amministratori' }, { status: 403 });
    }

    const body = await request.json() as DeleteAssetBody;
    if (!body.lessonId) {
      return NextResponse.json({ error: 'lessonId obbligatorio' }, { status: 400 });
    }

    // 2. Get the lesson's mux_asset_id
    const { data: lesson } = await supabase
      .from('lessons')
      .select('mux_asset_id')
      .eq('id', body.lessonId)
      .single<{ mux_asset_id: string | null }>();

    // 3. Delete asset from Mux if it exists
    if (lesson?.mux_asset_id) {
      const mux = getMuxClient();
      if (mux) {
        try {
          await mux.video.assets.delete(lesson.mux_asset_id);
        } catch {
          // Asset may already be deleted on Mux side
        }
      }
    }

    // 4. Reset lesson video fields in DB
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Database admin non configurato' }, { status: 503 });
    }

    await admin
      .from('lessons')
      .update({
        mux_asset_id: null,
        mux_playback_id: null,
        mux_status: 'waiting',
        duration_sec: null,
      })
      .eq('id', body.lessonId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[mux/delete-asset]', err);
    return NextResponse.json({ error: 'Errore durante l\'eliminazione del video' }, { status: 500 });
  }
}
