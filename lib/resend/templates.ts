const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://academy.aerabim.it';

const BRAND_DARK = '#040B11';
const BRAND_BLUE = '#304057';
const BRAND_LIGHT = '#9DB1BF';
const ACCENT_CYAN = '#4ECDC4';

function layout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${BRAND_DARK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_DARK};padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="padding:0 0 32px 0;">
          <span style="font-size:20px;font-weight:700;color:${ACCENT_CYAN};letter-spacing:0.5px;">AerACADEMY</span>
        </td></tr>
        <!-- Content -->
        <tr><td style="background-color:${BRAND_BLUE};border-radius:12px;padding:32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 0 0 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:${BRAND_LIGHT};opacity:0.6;">
            AERABIM S.R.L. &mdash; academy.aerabim.it
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;padding:12px 28px;background-color:${ACCENT_CYAN};color:${BRAND_DARK};font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">${text}</a>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#ffffff;">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:${BRAND_LIGHT};">${text}</p>`;
}

// ── D2: Welcome email ──────────────────────────────

export function welcomeEmail(userName: string): { subject: string; html: string } {
  return {
    subject: 'Benvenuto su AerACADEMY',
    html: layout(`
      ${heading(`Benvenuto, ${userName}!`)}
      ${paragraph('Il tuo account AerACADEMY è stato creato con successo. Sei pronto per iniziare il tuo percorso di formazione BIM.')}
      ${paragraph('<strong>Primi passi:</strong>')}
      ${paragraph('1. Esplora il catalogo corsi e trova quello giusto per te<br>2. Acquista un corso singolo o abbonati a tutti i contenuti<br>3. Studia al tuo ritmo e ottieni i certificati')}
      ${button('Esplora il catalogo', `${APP_URL}/catalogo-corsi`)}
    `),
  };
}

// ── D3: Purchase confirmation email ──────────────────

export function purchaseConfirmationEmail({
  userName,
  courseName,
  amount,
  courseSlug,
}: {
  userName: string;
  courseName: string;
  amount: string;
  courseSlug: string;
}): { subject: string; html: string } {
  return {
    subject: `Conferma acquisto: ${courseName}`,
    html: layout(`
      ${heading('Acquisto confermato')}
      ${paragraph(`Ciao ${userName}, il tuo acquisto è andato a buon fine.`)}
      <table style="width:100%;margin:16px 0;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:${BRAND_LIGHT};">Corso</td>
          <td style="padding:8px 0;font-size:14px;color:#ffffff;font-weight:600;text-align:right;">${courseName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:${BRAND_LIGHT};border-top:1px solid rgba(255,255,255,0.1);">Importo</td>
          <td style="padding:8px 0;font-size:14px;color:#ffffff;font-weight:600;text-align:right;border-top:1px solid rgba(255,255,255,0.1);">${amount}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:${BRAND_LIGHT};border-top:1px solid rgba(255,255,255,0.1);">Data</td>
          <td style="padding:8px 0;font-size:14px;color:#ffffff;font-weight:600;text-align:right;border-top:1px solid rgba(255,255,255,0.1);">${new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
        </tr>
      </table>
      ${paragraph('Puoi iniziare subito a studiare. Buon apprendimento!')}
      ${button('Vai al corso', `${APP_URL}/catalogo-corsi/${courseSlug}`)}
    `),
  };
}

// ── D4: Certificate issued email ──────────────────

export function certificateEmail({
  userName,
  courseName,
  verifyCode,
}: {
  userName: string;
  courseName: string;
  verifyCode: string;
}): { subject: string; html: string } {
  return {
    subject: `Certificato ottenuto: ${courseName}`,
    html: layout(`
      ${heading('Congratulazioni!')}
      ${paragraph(`${userName}, hai completato con successo il corso <strong>${courseName}</strong> e il tuo certificato è stato emesso.`)}
      <div style="margin:20px 0;padding:16px;background-color:rgba(78,205,196,0.1);border-radius:8px;border:1px solid rgba(78,205,196,0.2);text-align:center;">
        <p style="margin:0 0 4px 0;font-size:12px;color:${BRAND_LIGHT};">Codice di verifica</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:${ACCENT_CYAN};letter-spacing:1px;">${verifyCode}</p>
      </div>
      ${paragraph('Puoi scaricare il PDF del certificato dalla sezione Certificati nella tua dashboard.')}
      ${button('I miei certificati', `${APP_URL}/certificati`)}
    `),
  };
}

// ── D5: Subscription canceled email ──────────────────

export function subscriptionCanceledEmail({
  userName,
  endDate,
}: {
  userName: string;
  endDate: string;
}): { subject: string; html: string } {
  return {
    subject: 'Conferma cancellazione abbonamento',
    html: layout(`
      ${heading('Abbonamento cancellato')}
      ${paragraph(`Ciao ${userName}, confermiamo la cancellazione del tuo abbonamento Pro.`)}
      ${paragraph(`Il tuo accesso ai contenuti resterà attivo fino al <strong>${endDate}</strong>. Dopo quella data, potrai comunque accedere ai corsi acquistati singolarmente.`)}
      ${paragraph('Se cambi idea, puoi riabbonarti in qualsiasi momento dal catalogo corsi.')}
      ${button('Torna al catalogo', `${APP_URL}/catalogo-corsi`)}
    `),
  };
}
