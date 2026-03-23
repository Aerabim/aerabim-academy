import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { CommunicationComposer } from '@/components/admin/communications/CommunicationComposer';

export default async function AdminCommunicationsPage() {
  const admin = getSupabaseAdmin();

  let courses: { id: string; title: string }[] = [];

  if (admin) {
    try {
      const { data } = await admin
        .from('courses')
        .select('id, title')
        .eq('is_published', true)
        .order('title', { ascending: true });

      courses = (data ?? []) as { id: string; title: string }[];
    } catch (err) {
      console.error('Fetch courses error:', err);
    }
  }

  return (
    <div className="p-6 lg:p-10 w-full">
      <div className="mb-6">
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">Comunicazioni</h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">Invia email agli utenti della piattaforma.</p>
      </div>
      <CommunicationComposer courses={courses} />
    </div>
  );
}
