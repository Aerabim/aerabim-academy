import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/auth';
import { getStripeServer } from '@/lib/stripe/client';
import type { CreateCoursePayload, ApiError } from '@/types';

/** GET /api/admin/courses — list all courses (published + draft) */
export async function GET() {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const { data, error } = await admin
      .from('courses')
      .select('id, slug, title, area, level, price_single, is_free, is_published, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('List courses error:', error);
      return NextResponse.json(
        { error: 'Errore nel recupero dei corsi.' } satisfies ApiError,
        { status: 500 },
      );
    }

    const courses = (data ?? []) as {
      id: string;
      slug: string;
      title: string;
      area: string;
      level: string;
      price_single: number;
      is_free: boolean;
      is_published: boolean;
      created_at: string;
    }[];

    // Enrich with module/lesson/enrollment counts
    const courseIds = courses.map((c) => c.id);

    const [modulesRes, enrollmentsRes] = await Promise.all([
      admin
        .from('modules')
        .select('id, course_id')
        .in('course_id', courseIds.length > 0 ? courseIds : ['']),
      admin
        .from('enrollments')
        .select('id, course_id')
        .in('course_id', courseIds.length > 0 ? courseIds : ['']),
    ]);

    const modulesByCourse = new Map<string, number>();
    for (const m of (modulesRes.data ?? []) as { id: string; course_id: string }[]) {
      modulesByCourse.set(m.course_id, (modulesByCourse.get(m.course_id) ?? 0) + 1);
    }

    const enrollmentsByCourse = new Map<string, number>();
    for (const e of (enrollmentsRes.data ?? []) as { id: string; course_id: string }[]) {
      enrollmentsByCourse.set(e.course_id, (enrollmentsByCourse.get(e.course_id) ?? 0) + 1);
    }

    const enriched = courses.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      area: c.area,
      level: c.level,
      priceSingle: c.price_single,
      isFree: c.is_free,
      isPublished: c.is_published,
      moduleCount: modulesByCourse.get(c.id) ?? 0,
      enrolledCount: enrollmentsByCourse.get(c.id) ?? 0,
      createdAt: c.created_at,
    }));

    return NextResponse.json({ courses: enriched });
  } catch (err) {
    console.error('GET /api/admin/courses error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}

/** POST /api/admin/courses — create a new course */
export async function POST(req: Request) {
  try {
    const result = await verifyAdmin();
    if (result instanceof NextResponse) return result;
    const { admin } = result;

    const body = (await req.json()) as CreateCoursePayload;

    if (!body.title || !body.slug || !body.area || !body.level) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti: title, slug, area, level.' } satisfies ApiError,
        { status: 400 },
      );
    }

    // Check slug uniqueness
    const { data: existing } = await admin
      .from('courses')
      .select('id')
      .eq('slug', body.slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Slug già in uso. Scegli uno slug diverso.' } satisfies ApiError,
        { status: 409 },
      );
    }

    // Auto-create Stripe product + price if course is not free
    let stripePriceId: string | null = null;
    const priceCents = body.priceSingle ?? 0;

    if (!body.isFree && priceCents > 0) {
      const stripe = getStripeServer();
      if (stripe) {
        try {
          const product = await stripe.products.create({
            name: body.title,
            metadata: { slug: body.slug },
          });
          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: priceCents,
            currency: 'eur',
          });
          stripePriceId = price.id;
        } catch (stripeErr) {
          console.error('Stripe auto-create error:', stripeErr);
          // Non-blocking: course gets created without stripe_price_id
        }
      }
    }

    const { data: course, error: insertError } = await admin
      .from('courses')
      .insert({
        title: body.title,
        slug: body.slug,
        description: body.description ?? null,
        area: body.area,
        level: body.level,
        price_single: priceCents,
        is_free: body.isFree ?? false,
        is_published: false,
        thumbnail_url: body.thumbnailUrl ?? null,
        stripe_price_id: stripePriceId,
      })
      .select('id, slug, title')
      .single();

    if (insertError || !course) {
      console.error('Insert course error:', insertError);
      return NextResponse.json(
        { error: 'Errore durante la creazione del corso.' } satisfies ApiError,
        { status: 500 },
      );
    }

    return NextResponse.json({ course }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/courses error:', err);
    return NextResponse.json(
      { error: 'Errore interno del server.' } satisfies ApiError,
      { status: 500 },
    );
  }
}
