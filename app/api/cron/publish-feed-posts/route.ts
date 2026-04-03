import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Cron job: publishes scheduled feed posts whose publish_at has passed.
 * Triggered by Vercel Cron every 5 minutes.
 * Protected by CRON_SECRET.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Database non configurato.' }, { status: 503 });
  }

  const now = new Date().toISOString();

  const { data, error } = await admin
    .from('feed_posts')
    .update({ is_published: true, publish_at: null })
    .eq('is_published', false)
    .not('publish_at', 'is', null)
    .lte('publish_at', now)
    .select('id, title');

  if (error) {
    console.error('[cron/publish-feed-posts] Error:', error);
    return NextResponse.json({ error: 'Errore durante la pubblicazione.' }, { status: 500 });
  }

  const published = (data ?? []) as { id: string; title: string }[];
  console.log(`[cron/publish-feed-posts] Published ${published.length} posts:`, published.map((p) => p.id));

  return NextResponse.json({ published: published.length, ids: published.map((p) => p.id) });
}
