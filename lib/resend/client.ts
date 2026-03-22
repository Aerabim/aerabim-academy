import { Resend } from 'resend';

let resendInstance: Resend | null = null;

/**
 * Returns a Resend client, or null if RESEND_API_KEY is not configured.
 */
export function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;

  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }

  return resendInstance;
}

const FROM_ADDRESS = 'AerACADEMY <noreply@academy.aerabim.it>';

/**
 * Send an email via Resend. Logs errors but does not throw,
 * so email failures never block the main flow.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('Resend non configurato — email non inviata:', subject);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Errore invio email:', err);
    return false;
  }
}
