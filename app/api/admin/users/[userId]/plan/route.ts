import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import type { ApiError, UserPlan } from '@/types';

const VALID_PLANS: UserPlan[] = ['free', 'pro', 'team', 'pa'];

interface RouteParams {
  params: { userId: string };
}

/** PATCH /api/admin/users/[userId]/plan — change user plan (admin override) */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = await req.json();
    const newPlan = body.plan as string;

    if (!newPlan || !VALID_PLANS.includes(newPlan as UserPlan)) {
      return NextResponse.json(
        { error: `Piano non valido. Usa: ${VALID_PLANS.join(', ')}.` } satisfies ApiError,
        { status: 400 },
      );
    }

    if (newPlan === 'free') {
      // Setting to free = deactivate any active subscription
      const { error } = await admin
        .from('subscriptions')
        .update({ status: 'canceled' as const })
        .eq('user_id', params.userId)
        .eq('status', 'active');

      if (error) {
        console.error('Deactivate subscription error:', error);
        return NextResponse.json(
          { error: 'Errore durante l\'aggiornamento del piano.' } satisfies ApiError,
          { status: 500 },
        );
      }
    } else {
      // Check if user already has an active subscription
      const { data: existingSub } = await admin
        .from('subscriptions')
        .select('id')
        .eq('user_id', params.userId)
        .eq('status', 'active')
        .maybeSingle();

      if (existingSub) {
        // Update existing subscription plan
        const { error } = await admin
          .from('subscriptions')
          .update({ plan: newPlan })
          .eq('id', (existingSub as { id: string }).id);

        if (error) {
          console.error('Update subscription plan error:', error);
          return NextResponse.json(
            { error: 'Errore durante l\'aggiornamento del piano.' } satisfies ApiError,
            { status: 500 },
          );
        }
      } else {
        // Create a manual subscription record
        const { error } = await admin
          .from('subscriptions')
          .insert({
            user_id: params.userId,
            stripe_subscription_id: `manual_${Date.now()}`,
            stripe_customer_id: `manual_${params.userId}`,
            status: 'active',
            plan: newPlan,
            current_period_end: null,
          });

        if (error) {
          console.error('Create subscription error:', error);
          return NextResponse.json(
            { error: 'Errore durante la creazione dell\'abbonamento.' } satisfies ApiError,
            { status: 500 },
          );
        }
      }
    }

    return NextResponse.json({ success: true, plan: newPlan });
  } catch (err) {
    console.error('PATCH plan error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
