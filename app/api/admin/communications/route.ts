import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import { getResend } from '@/lib/resend/client';
import type { SendCommunicationPayload, ApiError } from '@/types';

const FROM_ADDRESS = 'AerACADEMY <noreply@academy.aerabim.it>';

export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;

  const resend = getResend();
  if (!resend) {
    return NextResponse.json({ error: 'Resend non configurato.' } satisfies ApiError, { status: 500 });
  }

  try {
    const body = (await request.json()) as SendCommunicationPayload;

    if (!body.subject?.trim() || !body.body?.trim()) {
      return NextResponse.json({ error: 'Oggetto e corpo del messaggio sono obbligatori.' } satisfies ApiError, { status: 400 });
    }

    // Collect recipient emails
    let emails: string[] = [];

    if (body.recipientType === 'all') {
      const { data: authUsers } = await auth.admin.auth.admin.listUsers({ perPage: 1000 });
      emails = (authUsers?.users ?? [])
        .map((u) => u.email)
        .filter((e): e is string => !!e);
    } else if (body.recipientType === 'course' && body.courseId) {
      // Get enrolled user IDs for the course
      const { data: enrollments } = await auth.admin
        .from('enrollments')
        .select('user_id')
        .eq('course_id', body.courseId)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      const userIds = (enrollments ?? []).map((e: { user_id: string }) => e.user_id);

      if (userIds.length > 0) {
        const { data: authUsers } = await auth.admin.auth.admin.listUsers({ perPage: 1000 });
        const userIdSet = new Set(userIds);
        emails = (authUsers?.users ?? [])
          .filter((u) => userIdSet.has(u.id))
          .map((u) => u.email)
          .filter((e): e is string => !!e);
      }
    } else {
      return NextResponse.json({ error: 'Tipo destinatario non valido.' } satisfies ApiError, { status: 400 });
    }

    if (emails.length === 0) {
      return NextResponse.json({ error: 'Nessun destinatario trovato.' } satisfies ApiError, { status: 400 });
    }

    // Build HTML email
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #040B11; padding: 24px; border-radius: 8px; color: #EAF0F4;">
          <h2 style="margin: 0 0 16px; color: #4ECDC4;">${body.subject}</h2>
          <div style="line-height: 1.6; color: #9DB1BF;">${body.body.replace(/\n/g, '<br/>')}</div>
          <hr style="border: none; border-top: 1px solid #304057; margin: 24px 0;" />
          <p style="font-size: 12px; color: #58758C; margin: 0;">AerACADEMY — Formazione BIM Professionale</p>
        </div>
      </div>
    `;

    // Send in batches of 50 (Resend batch limit is 100, we use 50 for safety)
    let sentCount = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      const batchPayload = batch.map((email) => ({
        from: FROM_ADDRESS,
        to: email,
        subject: body.subject,
        html: htmlBody,
      }));

      try {
        await resend.batch.send(batchPayload);
        sentCount += batch.length;
      } catch (batchErr) {
        console.error(`Batch send error (offset ${i}):`, batchErr);
      }
    }

    return NextResponse.json({ success: true, sentCount });
  } catch (err) {
    console.error('Communication send error:', err);
    return NextResponse.json({ error: 'Errore nell\'invio delle comunicazioni.' } satisfies ApiError, { status: 500 });
  }
}
