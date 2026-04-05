import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { LibreriaTabs } from '@/components/libreria/LibreriaTabs';
import type { LibreriaData, LibreriaCorso, LibreriaRisorsa, LibreriaPercorso, PlanInfo } from '@/components/libreria/types';
import type { AreaCode, LevelCode, ResourceType } from '@/types';

export default async function LaMiaLibreriaPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = getSupabaseAdmin();

  let data: LibreriaData = {
    hasActivePlan: false,
    planInfo: null,
    corsi: [],
    risorse: [],
    percorsi: [],
    acquistatiCount: 0,
    inclusiCorsi: [],
  };

  try {
    // ── Parallel fetch ──────────────────────────────────────
    const [subRes, enrollRes, subEnrollRes, purchaseRes, progressRes] = await Promise.all([
      // 1. Subscription attiva
      supabase
        .from('subscriptions')
        .select('plan, status, current_period_end')
        .eq('user_id', user.id)
        .in('status', ['active', 'past_due'])
        .maybeSingle(),

      // 2. Corsi acquistati singolarmente (access_type = 'single' | 'free')
      supabase
        .from('enrollments')
        .select('course_id, created_at, expires_at, courses(id, slug, title, area, level, thumbnail_url, duration_min)')
        .eq('user_id', user.id)
        .in('access_type', ['single', 'free']),

      // 3. Corsi inclusi nel piano (access_type = 'subscription')
      supabase
        .from('enrollments')
        .select('course_id, created_at, expires_at, courses(id, slug, title, area, level, thumbnail_url, duration_min)')
        .eq('user_id', user.id)
        .eq('access_type', 'subscription'),

      // 4. Risorse acquistate
      supabase
        .from('resource_purchases')
        .select('resource_id, purchased_at, resources(id, slug, title, type, thumbnail_url)')
        .eq('user_id', user.id),

      // 5. Percorsi iniziati o completati
      admin
        ? admin
            .from('learning_path_progress')
            .select('path_id, is_completed, completed_step_ids, updated_at, learning_paths(id, slug, title, thumbnail_url, estimated_hours)')
            .eq('user_id', user.id)
        : Promise.resolve({ data: [] }),
    ]);

    // ── Subscription ────────────────────────────────────────
    const sub = subRes.data as { plan: string; status: string; current_period_end: string | null } | null;
    const hasActivePlan = !!sub;
    const planInfo: PlanInfo | null = sub
      ? { plan: sub.plan, status: sub.status, currentPeriodEnd: sub.current_period_end }
      : null;

    // ── Corsi ────────────────────────────────────────────────
    type RawEnrollment = {
      course_id: string;
      created_at: string;
      expires_at: string | null;
      courses: { id: string; slug: string; title: string; area: string; level: string; thumbnail_url: string | null; duration_min: number | null } | null;
    };

    const mapEnrollment = (e: RawEnrollment): LibreriaCorso => ({
      id: e.courses!.id,
      slug: e.courses!.slug,
      title: e.courses!.title,
      area: e.courses!.area as AreaCode,
      level: e.courses!.level as LevelCode,
      thumbnailUrl: e.courses!.thumbnail_url,
      durationMin: e.courses!.duration_min,
      enrolledAt: e.created_at,
      expiresAt: e.expires_at,
    });

    const corsi: LibreriaCorso[] = ((enrollRes.data ?? []) as unknown as RawEnrollment[])
      .filter((e) => e.courses)
      .map(mapEnrollment);

    const inclusiCorsi: LibreriaCorso[] = ((subEnrollRes.data ?? []) as unknown as RawEnrollment[])
      .filter((e) => e.courses)
      .map(mapEnrollment);

    // ── Risorse ──────────────────────────────────────────────
    type RawPurchase = {
      resource_id: string;
      purchased_at: string;
      resources: { id: string; slug: string; title: string; type: string; thumbnail_url: string | null } | null;
    };
    const risorse: LibreriaRisorsa[] = ((purchaseRes.data ?? []) as unknown as RawPurchase[])
      .filter((p) => p.resources)
      .map((p) => ({
        id: p.resources!.id,
        slug: p.resources!.slug,
        title: p.resources!.title,
        type: p.resources!.type as ResourceType,
        thumbnailUrl: p.resources!.thumbnail_url,
        purchasedAt: p.purchased_at,
      }));

    // ── Percorsi ─────────────────────────────────────────────
    type RawProgress = {
      path_id: string;
      is_completed: boolean;
      completed_step_ids: string[];
      learning_paths: { id: string; slug: string; title: string; thumbnail_url: string | null; estimated_hours: number | null } | null;
    };

    let percorsi: LibreriaPercorso[] = [];
    if (admin && progressRes.data) {
      // Fetch step counts per path
      const pathIds = (progressRes.data as unknown as RawProgress[])
        .filter((p) => p.learning_paths)
        .map((p) => p.path_id);

      const stepCounts = new Map<string, number>();
      if (pathIds.length > 0) {
        const { data: stepRows } = await admin
          .from('learning_path_steps')
          .select('path_id')
          .in('path_id', pathIds);
        for (const s of (stepRows ?? []) as { path_id: string }[]) {
          stepCounts.set(s.path_id, (stepCounts.get(s.path_id) ?? 0) + 1);
        }
      }

      percorsi = (progressRes.data as unknown as RawProgress[])
        .filter((p) => p.learning_paths)
        .map((p) => ({
          id: p.learning_paths!.id,
          slug: p.learning_paths!.slug,
          title: p.learning_paths!.title,
          thumbnailUrl: p.learning_paths!.thumbnail_url,
          stepCount: stepCounts.get(p.path_id) ?? 0,
          estimatedHours: p.learning_paths!.estimated_hours,
          isCompleted: p.is_completed,
          completedSteps: p.completed_step_ids?.length ?? 0,
        }));
    }

    data = {
      hasActivePlan,
      planInfo,
      corsi,
      risorse,
      percorsi,
      acquistatiCount: corsi.length + risorse.length + percorsi.length,
      inclusiCorsi,
    };
  } catch (err) {
    console.error('LaMiaLibreriaPage error:', err);
  }

  return (
    <div className="w-full px-6 lg:px-9 py-7">
      <div className="mb-7">
        <h1 className="font-heading text-[1.4rem] font-bold text-text-primary tracking-tight">
          La Mia Libreria
        </h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">
          Corsi, risorse e percorsi acquistati o inclusi nel tuo piano.
        </p>
      </div>
      <LibreriaTabs data={data} />
    </div>
  );
}
