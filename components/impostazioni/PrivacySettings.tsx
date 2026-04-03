'use client';

import { useState } from 'react';
import { Toggle } from '@/components/ui/Toggle';
import type { FeedPrivacy } from '@/types';

interface PrivacySettingsProps {
  initial: FeedPrivacy;
}

interface ToggleConfig {
  key: keyof FeedPrivacy;
  label: string;
  description: string;
}

const TOGGLES: ToggleConfig[] = [
  {
    key: 'show_progress',
    label: 'Mostra i miei progressi nel feed',
    description: 'Gli altri utenti vedranno quando completi una lezione (es. "Mario ha completato Modellazione BIM — Lezione 3").',
  },
  {
    key: 'show_certificates',
    label: 'Mostra i miei certificati nel feed',
    description: 'Gli altri utenti vedranno quando consegui un certificato di completamento.',
  },
  {
    key: 'show_enrollments',
    label: 'Mostra le mie iscrizioni ai corsi nel feed',
    description: 'Gli altri utenti vedranno quando ti iscrivi a un nuovo corso.',
  },
  {
    key: 'show_online',
    label: 'Includi nel contatore utenti online',
    description: 'La tua presenza viene conteggiata nel numero di utenti attivi visibile nel feed. Disattiva per navigare in modo anonimo.',
  },
];

export function PrivacySettings({ initial }: PrivacySettingsProps) {
  const [privacy, setPrivacy] = useState<FeedPrivacy>(initial);
  const [saving, setSaving] = useState<keyof FeedPrivacy | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FeedPrivacy, string>>>({});

  async function handleToggle(key: keyof FeedPrivacy, value: boolean) {
    const previous = privacy[key];
    setPrivacy((prev) => ({ ...prev, [key]: value }));
    setSaving(key);
    setErrors((prev) => ({ ...prev, [key]: undefined }));

    try {
      const res = await fetch('/api/settings/privacy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });

      if (!res.ok) {
        throw new Error('Errore durante il salvataggio.');
      }
    } catch {
      // Rollback ottimistico
      setPrivacy((prev) => ({ ...prev, [key]: previous }));
      setErrors((prev) => ({ ...prev, [key]: 'Salvataggio fallito. Riprova.' }));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-1">
      {TOGGLES.map((t, i) => (
        <div key={t.key}>
          <div className={`py-4 ${i < TOGGLES.length - 1 ? 'border-b border-border-subtle' : ''}`}>
            <Toggle
              checked={privacy[t.key]}
              onChange={(val) => handleToggle(t.key, val)}
              disabled={saving === t.key}
              label={t.label}
              description={t.description}
            />
            {errors[t.key] && (
              <p className="text-[0.72rem] text-accent-rose mt-2">{errors[t.key]}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
