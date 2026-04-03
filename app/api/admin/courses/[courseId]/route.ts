import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin/auth';
import { getStripeServer } from '@/lib/stripe/client';
import { getMuxClient } from '@/lib/mux/helpers';
import { createBulkNotifications } from '@/lib/notifications/create';
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
    if (body.previewPlaybackId !== undefined) updateData.preview_playback_id = body.previewPlaybackId;
    if (body.previewAssetId !== undefined) updateData.preview_asset_id = body.previewAssetId;

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

    // Check current status before update (to detect publish transition)
    let wasPublished = true;
    if (body.status === 'published') {
      const { data: currentCourseStatus } = await admin
        .from('courses')
        .select('status')
        .eq('id', courseId)
        .single();

      wasPublished = (currentCourseStatus as { status: string } | null)?.status === 'published';
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

    // Notify all users when a course is newly published
    const updatedCourse = course as { id: string; slug: string; title: string; status: string };
    if (updatedCourse.status === 'published' && !wasPublished) {
      const { data: allProfiles } = await admin
        .from('profiles')
        .select('id');

      const userIds = ((allProfiles ?? []) as { id: string }[]).map((p) => p.id);

      if (userIds.length > 0) {
        await createBulkNotifications(admin, userIds, {
          type: 'admin_message',
          title: `Nuovo corso disponibile: ${updatedCourse.title}`,
          body: 'Un nuovo corso è stato aggiunto al catalogo. Scoprilo subito!',
          href: `/catalogo-corsi/${updatedCourse.slug}`,
        });
      }
    }

    revalidatePath('/admin/corsi');
    revalidatePath(`/admin/corsi/${courseId}`);
    return NextResponse.json({ course });
  } catch (err) {
    console.error('PATCH /api/admin/courses/[courseId] error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/courses/[courseId] — delete a course and all related data */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { courseId } = params;

    // Fetch course title and enrolled user IDs before deletion
    const [courseRes, enrollmentRes] = await Promise.all([
      admin.from('courses').select('title').eq('id', courseId).maybeSingle(),
      admin.from('enrollments').select('user_id').eq('course_id', courseId),
    ]);

    const courseTitle = (courseRes.data as { title: string } | null)?.title ?? 'Corso';
    const enrolledUserIds = ((enrollmentRes.data ?? []) as { user_id: string }[]).map((e) => e.user_id);

    // Notify enrolled users about course deletion
    if (enrolledUserIds.length > 0) {
      await createBulkNotifications(admin, enrolledUserIds, {
        type: 'course_deleted',
        title: `Corso rimosso: ${courseTitle}`,
        body: 'Il corso a cui eri iscritto è stato rimosso dalla piattaforma. Per informazioni contatta l\'assistenza.',
        href: '/assistenza',
      });
    }

    // Delete preview Mux asset if present (best-effort)
    const { data: courseData } = await admin
      .from('courses')
      .select('preview_asset_id')
      .eq('id', courseId)
      .maybeSingle();

    const previewAssetId = (courseData as { preview_asset_id: string | null } | null)?.preview_asset_id;
    if (previewAssetId) {
      const mux = getMuxClient();
      if (mux) {
        await mux.video.assets.delete(previewAssetId).catch(() => undefined);
      }
    }

    // Fetch module and lesson IDs for cascaded cleanup
    const { data: moduleRows } = await admin
      .from('modules')
      .select('id')
      .eq('course_id', courseId);

    const moduleIds = ((moduleRows ?? []) as { id: string }[]).map((m) => m.id);

    let lessonIds: string[] = [];
    let muxAssetIds: string[] = [];
    if (moduleIds.length > 0) {
      const { data: lessonRows } = await admin
        .from('lessons')
        .select('id, mux_asset_id')
        .in('module_id', moduleIds);

      const lessons = (lessonRows ?? []) as { id: string; mux_asset_id: string | null }[];
      lessonIds = lessons.map((l) => l.id);
      muxAssetIds = lessons
        .map((l) => l.mux_asset_id)
        .filter((id): id is string => !!id);
    }

    // Delete Mux assets (best-effort, non-blocking)
    if (muxAssetIds.length > 0) {
      const mux = getMuxClient();
      if (mux) {
        await Promise.allSettled(
          muxAssetIds.map((assetId) =>
            mux.video.assets.delete(assetId),
          ),
        );
      }
    }

    // Delete related records explicitly (belt-and-suspenders for CASCADE)
    if (lessonIds.length > 0) {
      await Promise.all([
        admin.from('progress').delete().in('lesson_id', lessonIds),
        admin.from('quiz_attempts').delete().in('lesson_id', lessonIds),
        admin.from('quiz_questions').delete().in('lesson_id', lessonIds),
      ]);

      await admin.from('lessons').delete().in('module_id', moduleIds);
    }

    if (moduleIds.length > 0) {
      await admin.from('modules').delete().eq('course_id', courseId);
    }

    await Promise.all([
      admin.from('enrollments').delete().eq('course_id', courseId),
      admin.from('certificates').delete().eq('course_id', courseId),
      admin.from('favorites').delete().eq('course_id', courseId),
    ]);

    // Finally delete the course itself
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

    revalidatePath('/admin/corsi');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/courses/[courseId] error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
