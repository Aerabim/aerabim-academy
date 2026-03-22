import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  verifyEnrollment,
  checkCourseCompletionForCertificate,
  getCertificateForCourse,
} from '@/lib/learn/queries';
import type { CertificateGenerateRequest, CertificateGenerateResponse, ApiError } from '@/types';

/**
 * Generates a verify code in the format ACA-XXXXXX
 */
function generateVerifyCode(): string {
  return `ACA-${nanoid(12).toUpperCase()}`;
}

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();

    // 1. Authenticate
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Devi effettuare il login.' } satisfies ApiError,
        { status: 401 },
      );
    }

    // 2. Parse body
    const body = (await req.json()) as CertificateGenerateRequest;
    if (!body.courseId) {
      return NextResponse.json(
        { error: 'ID corso non valido.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // 3. Verify enrollment
    const isEnrolled = await verifyEnrollment(supabase, user.id, body.courseId);
    if (!isEnrolled) {
      return NextResponse.json(
        { error: 'Non sei iscritto a questo corso.' } satisfies ApiError,
        { status: 403 },
      );
    }

    // 4. Check if certificate already exists
    const existing = await getCertificateForCourse(supabase, user.id, body.courseId);
    if (existing) {
      return NextResponse.json({
        success: true,
        certificateId: existing.id,
        verifyCode: existing.verify_code,
      } satisfies CertificateGenerateResponse);
    }

    // 5. Check completion requirements
    const completion = await checkCourseCompletionForCertificate(supabase, body.courseId, user.id);
    if (!completion.eligible) {
      return NextResponse.json(
        { error: completion.reason ?? 'Requisiti non soddisfatti.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // 6. Generate certificate via admin client
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Configurazione server incompleta.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const verifyCode = generateVerifyCode();
    const { data: cert, error: insertError } = await admin
      .from('certificates')
      .insert({
        user_id: user.id,
        course_id: body.courseId,
        verify_code: verifyCode,
      })
      .select('id, verify_code')
      .single();

    if (insertError || !cert) {
      return NextResponse.json(
        { error: 'Errore nella generazione del certificato.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const certRow = cert as { id: string; verify_code: string };

    return NextResponse.json({
      success: true,
      certificateId: certRow.id,
      verifyCode: certRow.verify_code,
    } satisfies CertificateGenerateResponse);
  } catch {
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
