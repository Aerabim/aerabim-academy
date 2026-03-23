import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, UserRole } from '@/types';

const VALID_ROLES: UserRole[] = ['student', 'admin', 'docente', 'tutor', 'moderatore'];

interface RouteParams {
  params: { userId: string };
}

/** PATCH /api/admin/users/[userId]/role — change user role */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = await req.json();
    const newRole = body.role as string;

    if (!newRole || !VALID_ROLES.includes(newRole as UserRole)) {
      return NextResponse.json(
        { error: `Ruolo non valido. Usa: ${VALID_ROLES.join(', ')}.` } satisfies ApiError,
        { status: 400 },
      );
    }

    const { error } = await admin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', params.userId);

    if (error) {
      console.error('Update role error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento del ruolo.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, role: newRole });
  } catch (err) {
    console.error('PATCH role error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
