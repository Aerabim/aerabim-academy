'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormField } from '@/components/admin/ui/FormField';
import { FormSelect } from '@/components/admin/ui/FormSelect';
import { FormTextarea } from '@/components/admin/ui/FormTextarea';

interface SessionFormProps {
  session?: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    hostName: string;
    scheduledAt: string;
    durationMin: number;
    maxParticipants: number | null;
    meetingUrl: string | null;
  };
}

export function SessionForm({ session }: SessionFormProps) {
  const router = useRouter();
  const isEditing = !!session;

  const [type, setType] = useState(session?.type ?? 'webinar');
  const [title, setTitle] = useState(session?.title ?? '');
  const [description, setDescription] = useState(session?.description ?? '');
  const [hostName, setHostName] = useState(session?.hostName ?? '');
  const [scheduledAt, setScheduledAt] = useState(
    session?.scheduledAt ? session.scheduledAt.slice(0, 16) : '',
  );
  const [durationMin, setDurationMin] = useState(String(session?.durationMin ?? 60));
  const [maxParticipants, setMaxParticipants] = useState(
    session?.maxParticipants ? String(session.maxParticipants) : '',
  );
  const [meetingUrl, setMeetingUrl] = useState(session?.meetingUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        type,
        title,
        description: description || undefined,
        hostName,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMin: parseInt(durationMin, 10) || 60,
        maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : undefined,
        meetingUrl: type === 'mentoring' ? meetingUrl || undefined : undefined,
      };

      const url = isEditing
        ? `/api/admin/live-sessions/${session.id}`
        : '/api/admin/live-sessions';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Errore durante il salvataggio.');
        return;
      }

      router.push('/admin/sessioni-live');
      router.refresh();
    } catch {
      setError('Errore di rete.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full">
      {error && (
        <div className="px-4 py-3 bg-accent-rose/10 border border-accent-rose/20 rounded-md text-[0.82rem] text-accent-rose">{error}</div>
      )}

      <FormSelect label="Tipo" id="type" value={type} onChange={setType} options={[{ value: 'webinar', label: 'Webinar' }, { value: 'mentoring', label: 'Mentoring' }]} required />
      <FormField label="Titolo" id="title" value={title} onChange={setTitle} required />
      <FormTextarea label="Descrizione" id="description" value={description} onChange={setDescription} rows={3} />
      <FormField label="Host" id="hostName" value={hostName} onChange={setHostName} required />
      <FormField label="Data e ora" id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={setScheduledAt} required />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Durata (min)" id="durationMin" type="number" value={durationMin} onChange={setDurationMin} />
        <FormField label="Max partecipanti" id="maxParticipants" type="number" value={maxParticipants} onChange={setMaxParticipants} hint="Lascia vuoto per illimitato." />
      </div>
      {type === 'mentoring' && (
        <FormField label="Meeting URL" id="meetingUrl" value={meetingUrl} onChange={setMeetingUrl} placeholder="https://meet.google.com/..." />
      )}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving} className="px-5 py-2.5 bg-accent-cyan/15 text-accent-cyan text-[0.82rem] font-semibold rounded-md border border-accent-cyan/20 hover:bg-accent-cyan/25 transition-colors disabled:opacity-50">
          {saving ? 'Salvataggio...' : isEditing ? 'Salva modifiche' : 'Crea sessione'}
        </button>
        <button type="button" onClick={() => router.back()} className="px-5 py-2.5 text-[0.82rem] font-medium text-text-secondary hover:text-text-primary transition-colors">Annulla</button>
      </div>
    </form>
  );
}
