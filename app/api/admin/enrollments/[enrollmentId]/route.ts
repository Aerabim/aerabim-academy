import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { enrollmentId: string };
}

/** PATCH /api/admin/enrollments/[enrollmentId] — revoke enrollment (set expires_at to now) */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.expiresAt !== undefined) updateData.expires_at = body.expiresAt;
    if (body.accessType !== undefined) updateData.access_type = body.accessType;

    // Revoke shortcut
    if (body.revoke) {
      updateData.expires_at = new Date().toISOString();
    }

    const { error } = await admin
      .from('enrollments')
      .update(updateData)
      .eq('id', params.enrollmentId);

    if (error) {
      console.error('Update enrollment error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH enrollment error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/enrollments/[enrollmentId] — hard delete enrollment */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { error } = await admin
      .from('enrollments')
      .delete()
      .eq('id', params.enrollmentId);

    if (error) {
      console.error('Delete enrollment error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'eliminazione.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE enrollment error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
