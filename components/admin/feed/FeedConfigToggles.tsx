'use client';

import { useState } from 'react';
import { Toggle } from '@/components/ui/Toggle';
import type { FeedConfig } from '@/types';

interface FeedConfigTogglesProps {
  initial: FeedConfig;
}

interface ToggleDef {
  key: keyof FeedConfig;
  label: string;
  description: string;
}

const TOGGLES: ToggleDef[] = [
  {
    key: 'progressEnabled',
    label: 'Progressi lezioni',
    description: 'Mostra nel feed quando un utente completa una lezione. Disattiva per nascondere questa sorgente a tutti gli utenti.',
  },
  {
    key: 'certificatesEnabled',
    label: 'Certificati conseguiti',
    description: 'Mostra nel feed quando un utente ottiene un certificato di completamento.',
  },
  {
    key: 'enrollmentsEnabled',
    label: 'Iscrizioni ai corsi',
    description: 'Mostra nel feed quando un utente si iscrive a un corso.',
  },
  {
    key: 'discussionsEnabled',
    label: 'Discussioni community',
    description: 'Mostra nel feed le nuove discussioni aperte in community.',
  },
];

export function FeedConfigToggles({ initial }: FeedConfigTogglesProps) {
  const [config, setConfig] = useState<FeedConfig>(initial);
  const [saving, setSaving] = useState<keyof FeedConfig | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FeedConfig, string>>>({});

  async function handleToggle(key: keyof FeedConfig, value: boolean) {
    const previous = config[key];
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaving(key);
    setErrors((prev) => ({ ...prev, [key]: undefined }));

    try {
      const res = await fetch('/api/admin/feed/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setConfig((prev) => ({ ...prev, [key]: previous }));
      setErrors((prev) => ({ ...prev, [key]: 'Salvataggio fallito. Riprova.' }));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-1">
      {TOGGLES.map((t, i) => (
        <div key={t.key} className={`py-4 ${i < TOGGLES.length - 1 ? 'border-b border-border-subtle' : ''}`}>
          <Toggle
            checked={config[t.key]}
            onChange={(val) => handleToggle(t.key, val)}
            disabled={saving === t.key}
            label={t.label}
            description={t.description}
          />
          {errors[t.key] && (
            <p className="text-[0.72rem] text-accent-rose mt-2">{errors[t.key]}</p>
          )}
        </div>
      ))}
    </div>
  );
}
