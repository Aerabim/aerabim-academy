import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { SessionRequestAdminTable } from '@/components/admin/sessions/SessionRequestAdminTable';

export default async function AdminSessionRequestsPage() {
  const admin = getSupabaseAdmin();
  let requests: {
    id: string; userId: string; userName: string; userEmail: string;
    topic: string; preferredWeek: string; preferredSlot: string;
    status: string; adminNote: string | null; createdAt: string;
  }[] = [];

  if (admin) {
    try {
      const { data } = await admin
        .from('session_requests')
        .select('id, user_id, topic, preferred_week, preferred_slot, status, admin_note, created_at')
        .order('created_at', { ascending: false });

      const raw = (data ?? []) as {
        id: string; user_id: string; topic: string; preferred_week: string;
        preferred_slot: string; status: string; admin_note: string | null; created_at: string;
      }[];

      const userIds = Array.from(new Set(raw.map((r) => r.user_id)));

      const [profilesRes, emailsRes] = await Promise.all([
        admin.from('profiles').select('id, display_name').in('id', userIds.length > 0 ? userIds : ['']),
        admin.auth.admin.listUsers({ perPage: 1000 }),
      ]);

      const nameMap = new Map(
        ((profilesRes.data ?? []) as { id: string; display_name: string | null }[])
          .map((p) => [p.id, p.display_name ?? 'Utente']),
      );
      const emailMap = new Map<string, string>();
      if (emailsRes.data?.users) {
        for (const u of emailsRes.data.users) emailMap.set(u.id, u.email ?? '');
      }

      requests = raw.map((r) => ({
        id: r.id,
        userId: r.user_id,
        userName: nameMap.get(r.user_id) ?? 'Utente',
        userEmail: emailMap.get(r.user_id) ?? '',
        topic: r.topic,
        preferredWeek: r.preferred_week,
        preferredSlot: r.preferred_slot,
        status: r.status,
        adminNote: r.admin_note,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.error('Session requests error:', err);
    }
  }

  return (
    <div className="p-6 lg:p-10 w-full">
      <div className="mb-6">
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">Richieste Sessioni</h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">Gestisci le richieste di sessioni personalizzate.</p>
      </div>
      <SessionRequestAdminTable requests={requests} />
    </div>
  );
}
