import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { ApiError } from '@/types';

interface CertificateRow {
  id: string;
  user_id: string;
  course_id: string;
  verify_code: string;
  issued_at: string;
}

interface CourseRow {
  title: string;
}

/**
 * GET /api/certificati/[id] — Generate and download certificate PDF.
 *
 * Generates a simple PDF certificate with course name, user info, date,
 * and verification code. Uses raw PDF generation (no external PDF library).
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
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

    // 2. Fetch certificate (RLS ensures only owner can read)
    const { data: certData } = await supabase
      .from('certificates')
      .select('id, user_id, course_id, verify_code, issued_at')
      .eq('id', params.id)
      .single();

    const cert = certData as CertificateRow | null;

    if (!cert) {
      return NextResponse.json(
        { error: 'Certificato non trovato.' } satisfies ApiError,
        { status: 404 },
      );
    }

    // 3. Verify ownership
    if (cert.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Accesso non autorizzato.' } satisfies ApiError,
        { status: 403 },
      );
    }

    // 4. Fetch course name
    const { data: courseData } = await supabase
      .from('courses')
      .select('title')
      .eq('id', cert.course_id)
      .single();

    const course = courseData as CourseRow | null;
    const courseName = course?.title ?? 'Corso AerACADEMY';

    // 5. Get user name from metadata
    const userName = (user.user_metadata?.full_name as string)
      ?? user.email
      ?? 'Studente';

    // 6. Format date
    const issuedDate = new Date(cert.issued_at).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // 7. Generate PDF
    const pdfBytes = generateCertificatePdf({
      userName,
      courseName,
      issuedDate,
      verifyCode: cert.verify_code,
    });

    return new Response(pdfBytes.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificato-${cert.verify_code}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

// ── PDF Generation (raw PDF 1.4) ────────────────────

interface CertPdfData {
  userName: string;
  courseName: string;
  issuedDate: string;
  verifyCode: string;
}

function generateCertificatePdf(data: CertPdfData): Uint8Array {
  const { userName, courseName, issuedDate, verifyCode } = data;

  // Page dimensions: A4 landscape (842 x 595 points)
  const pageWidth = 842;
  const pageHeight = 595;
  const centerX = pageWidth / 2;

  // Build PDF content stream
  const contentLines: string[] = [];

  // Background rectangle (brand-dark)
  contentLines.push('0.016 0.043 0.067 rg'); // #040B11
  contentLines.push(`0 0 ${pageWidth} ${pageHeight} re f`);

  // Border rectangle (accent-cyan)
  contentLines.push('0.306 0.804 0.769 RG'); // #4ECDC4
  contentLines.push('2 w');
  contentLines.push(`30 30 ${pageWidth - 60} ${pageHeight - 60} re S`);

  // Inner border
  contentLines.push('0.188 0.251 0.341 RG'); // #304057
  contentLines.push('0.5 w');
  contentLines.push(`45 45 ${pageWidth - 90} ${pageHeight - 90} re S`);

  // Title: "CERTIFICATO DI COMPLETAMENTO"
  contentLines.push('BT');
  contentLines.push('0.306 0.804 0.769 rg'); // cyan
  contentLines.push(`/F1 12 Tf`);
  contentLines.push(`${centerX} 500 Td`);
  contentLines.push('1 0 0 1 0 0 Tm');
  const titleText = 'CERTIFICATO DI COMPLETAMENTO';
  const titleWidth = titleText.length * 7.2; // approximate
  contentLines.push(`${centerX - titleWidth / 2} 500 Td`);
  contentLines.push(`(${escapePdf(titleText)}) Tj`);
  contentLines.push('ET');

  // "AERABIM S.R.L." subtitle
  contentLines.push('BT');
  contentLines.push('0.345 0.459 0.549 rg'); // brand-gray
  contentLines.push(`/F1 9 Tf`);
  const subText = 'AERABIM S.R.L. - AerACADEMY';
  const subWidth = subText.length * 5.4;
  contentLines.push(`${centerX - subWidth / 2} 478 Td`);
  contentLines.push(`(${escapePdf(subText)}) Tj`);
  contentLines.push('ET');

  // Divider line
  contentLines.push('0.306 0.804 0.769 RG');
  contentLines.push('0.5 w');
  contentLines.push(`${centerX - 120} 460 m ${centerX + 120} 460 l S`);

  // "Si certifica che"
  contentLines.push('BT');
  contentLines.push('0.616 0.690 0.749 rg'); // brand-light
  contentLines.push(`/F1 10 Tf`);
  const certText = 'Si certifica che';
  const certWidth = certText.length * 5.5;
  contentLines.push(`${centerX - certWidth / 2} 420 Td`);
  contentLines.push(`(${escapePdf(certText)}) Tj`);
  contentLines.push('ET');

  // User name
  contentLines.push('BT');
  contentLines.push('0.918 0.941 0.957 rg'); // text-primary
  contentLines.push(`/F1 20 Tf`);
  const nameWidth = userName.length * 11;
  contentLines.push(`${centerX - nameWidth / 2} 385 Td`);
  contentLines.push(`(${escapePdf(userName)}) Tj`);
  contentLines.push('ET');

  // "ha completato con successo il corso"
  contentLines.push('BT');
  contentLines.push('0.616 0.690 0.749 rg');
  contentLines.push(`/F1 10 Tf`);
  const compText = 'ha completato con successo il corso';
  const compWidth = compText.length * 5.5;
  contentLines.push(`${centerX - compWidth / 2} 350 Td`);
  contentLines.push(`(${escapePdf(compText)}) Tj`);
  contentLines.push('ET');

  // Course name
  contentLines.push('BT');
  contentLines.push('0.306 0.804 0.769 rg'); // cyan
  contentLines.push(`/F1 16 Tf`);
  const courseWidth = courseName.length * 8.5;
  contentLines.push(`${centerX - courseWidth / 2} 310 Td`);
  contentLines.push(`(${escapePdf(courseName)}) Tj`);
  contentLines.push('ET');

  // Divider line 2
  contentLines.push('0.188 0.251 0.341 RG');
  contentLines.push('0.5 w');
  contentLines.push(`${centerX - 100} 280 m ${centerX + 100} 280 l S`);

  // Date
  contentLines.push('BT');
  contentLines.push('0.345 0.459 0.549 rg');
  contentLines.push(`/F1 10 Tf`);
  const dateText = `Data: ${issuedDate}`;
  const dateWidth = dateText.length * 5.5;
  contentLines.push(`${centerX - dateWidth / 2} 250 Td`);
  contentLines.push(`(${escapePdf(dateText)}) Tj`);
  contentLines.push('ET');

  // Verify code
  contentLines.push('BT');
  contentLines.push('0.345 0.459 0.549 rg');
  contentLines.push(`/F1 9 Tf`);
  const verifyText = `Codice di verifica: ${verifyCode}`;
  const verifyWidth = verifyText.length * 5;
  contentLines.push(`${centerX - verifyWidth / 2} 230 Td`);
  contentLines.push(`(${escapePdf(verifyText)}) Tj`);
  contentLines.push('ET');

  // Verification URL
  contentLines.push('BT');
  contentLines.push('0.345 0.459 0.549 rg');
  contentLines.push(`/F1 8 Tf`);
  const urlText = 'Verifica su: academy.aerabim.it/verifica-certificato';
  const urlWidth = urlText.length * 4.4;
  contentLines.push(`${centerX - urlWidth / 2} 210 Td`);
  contentLines.push(`(${escapePdf(urlText)}) Tj`);
  contentLines.push('ET');

  // Footer
  contentLines.push('BT');
  contentLines.push('0.345 0.459 0.549 rg');
  contentLines.push(`/F1 7 Tf`);
  const footerText = 'AERABIM S.R.L. - Formazione Professionale BIM/AEC';
  const footerWidth = footerText.length * 3.8;
  contentLines.push(`${centerX - footerWidth / 2} 70 Td`);
  contentLines.push(`(${escapePdf(footerText)}) Tj`);
  contentLines.push('ET');

  const contentStream = contentLines.join('\n');

  // Build PDF structure
  const objects: string[] = [];

  // Object 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

  // Object 2: Pages
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');

  // Object 3: Page
  objects.push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`,
  );

  // Object 4: Content stream
  const streamBytes = new TextEncoder().encode(contentStream);
  objects.push(
    `4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${contentStream}\nendstream\nendobj`,
  );

  // Object 5: Font (Helvetica)
  objects.push(
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj',
  );

  // Build final PDF
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];

  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

function escapePdf(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[àáâãä]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u');
}
