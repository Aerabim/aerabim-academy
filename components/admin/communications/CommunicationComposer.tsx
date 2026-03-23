'use client';

import { useState } from 'react';
import { FormField } from '@/components/admin/ui/FormField';
import { FormSelect } from '@/components/admin/ui/FormSelect';
import { FormTextarea } from '@/components/admin/ui/FormTextarea';

interface CourseOption {
  id: string;
  title: string;
}

interface CommunicationComposerProps {
  courses: CourseOption[];
}

const RECIPIENT_OPTIONS = [
  { value: 'all', label: 'Tutti gli utenti' },
  { value: 'course', label: 'Iscritti a un corso' },
];

export function CommunicationComposer({ courses }: CommunicationComposerProps) {
  const [recipientType, setRecipientType] = useState('all');
  const [courseId, setCourseId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const courseOptions = courses.map((c) => ({ value: c.id, label: c.title }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    if (recipientType === 'course' && !courseId) return;

    setResult(null);
    setSending(true);

    try {
      const payload: Record<string, unknown> = {
        subject: subject.trim(),
        body: body.trim(),
        recipientType,
      };

      if (recipientType === 'course') {
        payload.courseId = courseId;
      }

      const res = await fetch('/api/admin/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: `Email inviata con successo a ${data.sentCount} destinatari.`,
        });
        setSubject('');
        setBody('');
      } else {
        setResult({
          success: false,
          message: data.error ?? 'Errore durante l\'invio.',
        });
      }
    } catch {
      setResult({ success: false, message: 'Errore di rete.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full">
      {result && (
        <div
          className={`px-4 py-3 rounded-md text-[0.82rem] border ${
            result.success
              ? 'bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald'
              : 'bg-accent-rose/10 border-accent-rose/20 text-accent-rose'
          }`}
        >
          {result.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormSelect
          label="Destinatari"
          id="recipientType"
          value={recipientType}
          onChange={setRecipientType}
          options={RECIPIENT_OPTIONS}
        />
        {recipientType === 'course' && (
          <FormSelect
            label="Corso"
            id="courseId"
            value={courseId}
            onChange={setCourseId}
            options={[{ value: '', label: 'Seleziona un corso...' }, ...courseOptions]}
            required
          />
        )}
      </div>

      <FormField
        label="Oggetto"
        id="emailSubject"
        value={subject}
        onChange={setSubject}
        placeholder="es. Nuovo modulo disponibile!"
        required
      />

      <FormTextarea
        label="Corpo del messaggio"
        id="emailBody"
        value={body}
        onChange={setBody}
        placeholder="Scrivi il tuo messaggio qui... (supporta interruzioni di riga)"
        rows={8}
        required
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={sending || !subject.trim() || !body.trim() || (recipientType === 'course' && !courseId)}
          className="px-5 py-2.5 bg-accent-cyan/15 text-accent-cyan text-[0.82rem] font-semibold rounded-md border border-accent-cyan/20 hover:bg-accent-cyan/25 transition-colors disabled:opacity-50"
        >
          {sending ? 'Invio in corso...' : 'Invia comunicazione'}
        </button>
        <span className="text-[0.72rem] text-text-muted">
          {recipientType === 'all'
            ? 'Verrà inviata a tutti gli utenti registrati'
            : courseId
              ? `Verrà inviata agli iscritti del corso selezionato`
              : 'Seleziona un corso'}
        </span>
      </div>
    </form>
  );
}
