import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/profilo/ProfileForm';
import { SubscriptionSection } from '@/components/profilo/SubscriptionSection';
import { EnrollmentHistory } from '@/components/profilo/EnrollmentHistory';
import type { Subscription, AreaCode } from '@/types';

interface EnrollmentRow {
  id: string;
  course_id: string;
  access_type: string;
  created_at: string;
  expires_at: string | null;
  courses: { title: string; area: AreaCode } | null;
}

export default async function ProfiloPage() {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch active subscription
  let subscription: Subscription | null = null;
  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    subscription = data as Subscription | null;
  } catch {
    // subscription remains null
  }

  // Fetch enrollment history with course titles
  let enrollments: EnrollmentRow[] = [];
  try {
    const { data } = await supabase
      .from('enrollments')
      .select('id, course_id, access_type, created_at, expires_at, courses(title, area)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    enrollments = (data as EnrollmentRow[] | null) ?? [];
  } catch {
    // enrollments remains empty
  }

  const metadata = user.user_metadata as Record<string, string | undefined>;

  const profileData = {
    email: user.email ?? '',
    fullName: (metadata.full_name as string) ?? '',
    firstName: (metadata.first_name as string) ?? '',
    lastName: (metadata.last_name as string) ?? '',
    company: (metadata.company as string) ?? '',
    jobRole: (metadata.job_role as string) ?? '',
  };

  const plan = subscription ? subscription.plan : 'free';
  const periodEnd = subscription?.current_period_end ?? null;
  const stripeSubscriptionId = subscription?.stripe_subscription_id ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Profilo</h1>
        <p className="mt-1 text-brand-gray">
          Gestisci le tue informazioni personali e il tuo account.
        </p>
      </div>

      {/* Personal info + password */}
      <ProfileForm initialData={profileData} />

      {/* Subscription */}
      <SubscriptionSection
        plan={plan}
        periodEnd={periodEnd}
        stripeSubscriptionId={stripeSubscriptionId}
      />

      {/* Enrollment history */}
      <EnrollmentHistory enrollments={enrollments.map((e) => ({
        id: e.id,
        courseTitle: e.courses?.title ?? 'Corso rimosso',
        area: e.courses?.area ?? 'SW',
        accessType: e.access_type,
        createdAt: e.created_at,
        expiresAt: e.expires_at,
      }))} />
    </div>
  );
}
