import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend/client';

const CATEGORY_LABELS: Record<string, string> = {
  account: 'Account e accesso',
  pagamenti: 'Pagamenti e fatturazione',
  corsi: 'Corsi e contenuti',
  certificati: 'Certificati',
  tecnico: 'Problema tecnico',
  altro: 'Altro',
};

const SUPPORT_EMAIL = 'supporto@aerabim.it';

interface SupportRequest {
  category: string;
  subject: string;
  message: string;
}

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Devi effettuare il login.' }, { status: 401 });
    }

    const body = (await req.json()) as SupportRequest;

    if (!body.category || !body.subject?.trim() || !body.message?.trim()) {
      return NextResponse.json({ error: 'Compila tutti i campi.' }, { status: 400 });
    }

    if (!CATEGORY_LABELS[body.category]) {
      return NextResponse.json({ error: 'Categoria non valida.' }, { status: 400 });
    }

    const userName = (user.user_metadata?.full_name as string) || 'Utente';
    const userEmail = user.email || 'N/A';
    const categoryLabel = CATEGORY_LABELS[body.category];

    // Send email to support team
    const supportHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px;">
        <h2 style="color: #304057; margin-bottom: 24px;">Nuova richiesta di assistenza</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; color: #666; width: 120px;">Utente</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${userName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; color: #666;">Email</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${userEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; color: #666;">User ID</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 12px; color: #999;">${user.id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; color: #666;">Categoria</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${categoryLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; color: #666;">Oggetto</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: 600;">${body.subject}</td>
          </tr>
        </table>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 16px;">
          <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Messaggio</p>
          <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${body.message}</p>
        </div>
      </div>
    `;

    const sent = await sendEmail({
      to: SUPPORT_EMAIL,
      subject: `[Assistenza] ${categoryLabel} — ${body.subject}`,
      html: supportHtml,
    });

    // Send confirmation to user
    if (user.email) {
      const confirmHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px;">
          <div style="background: #040B11; padding: 24px 32px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #4ECDC4; margin: 0; font-size: 20px;">AerACADEMY</h1>
          </div>
          <div style="padding: 32px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="color: #333;">Ciao ${userName},</p>
            <p style="color: #333; line-height: 1.6;">
              Abbiamo ricevuto la tua richiesta di assistenza. Ti risponderemo il prima possibile.
            </p>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 4px; color: #666; font-size: 13px;"><strong>Categoria:</strong> ${categoryLabel}</p>
              <p style="margin: 0 0 4px; color: #666; font-size: 13px;"><strong>Oggetto:</strong> ${body.subject}</p>
            </div>
            <p style="color: #999; font-size: 13px;">
              Non rispondere a questa email. Per aggiornamenti, contattaci tramite la pagina Assistenza sulla piattaforma.
            </p>
          </div>
        </div>
      `;

      sendEmail({
        to: user.email,
        subject: `Richiesta ricevuta: ${body.subject}`,
        html: confirmHtml,
      });
    }

    if (!sent) {
      return NextResponse.json(
        { error: 'Impossibile inviare il messaggio. Riprova più tardi.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Errore interno del server.' }, { status: 500 });
  }
}
