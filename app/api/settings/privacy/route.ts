import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { ApiError, FeedPrivacy } from '@/types';

/** GET /api/settings/privacy — returns current user feed privacy preferences */
export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autenticato.' } satisfies ApiError, { status: 401 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('feed_privacy')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Profilo non trovato.' } satisfies ApiError, { status: 404 });
    }

    const profile = data as { feed_privacy: FeedPrivacy };
    return NextResponse.json({ privacy: profile.feed_privacy });
  } catch (err) {
    console.error('GET /api/settings/privacy error:', err);
    return NextResponse.json({ error: 'Errore interno.' } satisfies ApiError, { status: 500 });
  }
}

/** PATCH /api/settings/privacy — updates one or more privacy preferences */
export async function PATCH(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autenticato.' } satisfies ApiError, { status: 401 });
    }

    const body = await req.json() as Partial<FeedPrivacy>;

    // Fetch current privacy to merge
    const { data: profileData } = await supabase
      .from('profiles')
      .select('feed_privacy')
      .eq('id', user.id)
      .maybeSingle();

    const current: FeedPrivacy = (profileData as { feed_privacy: FeedPrivacy } | null)?.feed_privacy ?? {
      show_progress: true,
      show_certificates: true,
      show_enrollments: true,
      show_online: true,
    };

    const updated: FeedPrivacy = {
      show_progress: body.show_progress ?? current.show_progress,
      show_certificates: body.show_certificates ?? current.show_certificates,
      show_enrollments: body.show_enrollments ?? current.show_enrollments,
      show_online: body.show_online ?? current.show_online,
    };

    const { error } = await (supabase as unknown as { from: (t: string) => { update: (d: unknown) => { eq: (c: string, v: string) => Promise<{ error: unknown }> } } })
      .from('profiles')
      .update({ feed_privacy: updated })
      .eq('id', user.id);

    if (error) {
      console.error('PATCH privacy error:', error);
      return NextResponse.json({ error: 'Errore durante il salvataggio.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ privacy: updated });
  } catch (err) {
    console.error('PATCH /api/settings/privacy error:', err);
    return NextResponse.json({ error: 'Errore interno.' } satisfies ApiError, { status: 500 });
  }
}
