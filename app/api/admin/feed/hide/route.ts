import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

/** POST /api/admin/feed/hide — hide a specific feed item from moderation */
export async function POST(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin, userId } = result;

    const body = await req.json() as { itemType?: string; itemId?: string };

    if (!body.itemType || !body.itemId) {
      return NextResponse.json(
        { error: 'itemType e itemId sono obbligatori.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const validTypes = new Set(['progress', 'certificate', 'enrollment', 'discussion']);
    if (!validTypes.has(body.itemType)) {
      return NextResponse.json(
        { error: 'itemType non valido.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const { error } = await admin
      .from('feed_hidden_items')
      .upsert(
        { item_type: body.itemType, item_id: body.itemId, hidden_by: userId },
        { onConflict: 'item_type,item_id' },
      );

    if (error) {
      console.error('POST feed_hidden_items error:', error);
      return NextResponse.json({ error: 'Errore durante la moderazione.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/admin/feed/hide error:', err);
    return NextResponse.json({ error: 'Errore interno.' } satisfies ApiError, { status: 500 });
  }
}

/** DELETE /api/admin/feed/hide — restore a hidden feed item */
export async function DELETE(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = await req.json() as { itemType?: string; itemId?: string };

    if (!body.itemType || !body.itemId) {
      return NextResponse.json(
        { error: 'itemType e itemId sono obbligatori.' } satisfies ApiError,
        { status: 400 },
      );
    }

    const { error } = await admin
      .from('feed_hidden_items')
      .delete()
      .eq('item_type', body.itemType)
      .eq('item_id', body.itemId);

    if (error) {
      console.error('DELETE feed_hidden_items error:', error);
      return NextResponse.json({ error: 'Errore durante il ripristino.' } satisfies ApiError, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/feed/hide error:', err);
    return NextResponse.json({ error: 'Errore interno.' } satisfies ApiError, { status: 500 });
  }
}
