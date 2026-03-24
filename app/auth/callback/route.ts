import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { sendEmail } from '@/lib/resend/client';
import { welcomeEmail } from '@/lib/resend/templates';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createNotification } from '@/lib/notifications/create';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';

  if (code) {
    const response = NextResponse.redirect(new URL(next, origin));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Send welcome email for newly registered users (created in the last 2 minutes)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const createdAt = new Date(user.created_at);
          const isNewUser = Date.now() - createdAt.getTime() < 2 * 60 * 1000;
          if (isNewUser && user.email) {
            const name = (user.user_metadata?.full_name as string) || 'studente';
            const email = welcomeEmail(name);
            await sendEmail({ to: user.email, ...email }).catch(() => {
              // Email failure must never block auth callback
            });

            // Welcome notification
            const admin = getSupabaseAdmin();
            if (admin) {
              createNotification(admin, {
                userId: user.id,
                type: 'welcome',
                title: 'Benvenuto su AerACADEMY!',
                body: 'Esplora il catalogo corsi e inizia la tua formazione BIM.',
                href: '/catalogo-corsi',
              });
            }
          }
        }
      } catch {
        // Email failure must never block auth callback
      }

      return response;
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', origin));
}
