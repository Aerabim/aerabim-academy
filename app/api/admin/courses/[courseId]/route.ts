import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import { getStripeServer } from '@/lib/stripe/client';
import type { ApiError } from '@/types';

interface RouteParams {
  params: { courseId: string };
}

/** PATCH /api/admin/courses/[courseId] — update course fields */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = await req.json();
    const { courseId } = params;

    // Build update payload (only include provided fields)
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.area !== undefined) updateData.area = body.area;
    if (body.level !== undefined) updateData.level = body.level;
    if (body.priceSingle !== undefined) updateData.price_single = body.priceSingle;
    if (body.isFree !== undefined) updateData.is_free = body.isFree;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.thumbnailUrl !== undefined) updateData.thumbnail_url = body.thumbnailUrl;
    if (body.stripePriceId !== undefined) updateData.stripe_price_id = body.stripePriceId;
    if (body.durationMin !== undefined) updateData.duration_min = body.durationMin;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nessun campo da aggiornare.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Auto-create/update Stripe price if price changed and course is not free
    if (body.priceSingle !== undefined && !body.isFree && body.priceSingle > 0) {
      const stripe = getStripeServer();
      if (stripe) {
        try {
          // Fetch current course to check if price actually changed
          const { data: currentCourse } = await admin
            .from('courses')
            .select('price_single, stripe_price_id, title, slug')
            .eq('id', courseId)
            .single();

          const current = currentCourse as { price_single: number; stripe_price_id: string | null; title: string; slug: string } | null;

          if (current && current.price_single !== body.priceSingle) {
            // Price changed — create new Stripe price
            // Try to find existing product or create new one
            let productId: string | null = null;

            if (current.stripe_price_id) {
              try {
                const existingPrice = await stripe.prices.retrieve(current.stripe_price_id);
                productId = typeof existingPrice.product === 'string'
                  ? existingPrice.product
                  : existingPrice.product.id;
              } catch {
                // Price not found, will create new product
              }
            }

            if (!productId) {
              const product = await stripe.products.create({
                name: body.title ?? current.title,
                metadata: { slug: body.slug ?? current.slug },
              });
              productId = product.id;
            }

            const newPrice = await stripe.prices.create({
              product: productId,
              unit_amount: body.priceSingle,
              currency: 'eur',
            });

            updateData.stripe_price_id = newPrice.id;
          }
        } catch (stripeErr) {
          console.error('Stripe price update error:', stripeErr);
          // Non-blocking
        }
      }
    }

    // If slug is being changed, check uniqueness
    if (updateData.slug) {
      const { data: existing } = await admin
        .from('courses')
        .select('id')
        .eq('slug', updateData.slug as string)
        .neq('id', courseId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: 'Slug già in uso.' } satisfies ApiError,
          { status: 409 },
        );
      }
    }

    const { data: course, error: updateError } = await admin
      .from('courses')
      .update(updateData)
      .eq('id', courseId)
      .select('id, slug, title, status')
      .single();

    if (updateError || !course) {
      console.error('Update course error:', updateError);
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento del corso.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ course });
  } catch (err) {
    console.error('PATCH /api/admin/courses/[courseId] error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/courses/[courseId] — delete a course */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { courseId } = params;

    const { error } = await admin
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      console.error('Delete course error:', error);
      return NextResponse.json(
        { error: 'Errore durante l\'eliminazione del corso.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/courses/[courseId] error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
