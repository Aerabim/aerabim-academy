import type { LevelCode, AreaCode, ResourceType } from '@/types';

/* ── Acquistati ─────────────────────────────────────────── */

export interface LibreriaCorso {
  id: string;
  slug: string;
  title: string;
  area: AreaCode;
  level: LevelCode;
  thumbnailUrl: string | null;
  durationMin: number | null;
  enrolledAt: string;
  expiresAt: string | null;
}

export interface LibreriaRisorsa {
  id: string;
  slug: string;
  title: string;
  type: ResourceType;
  thumbnailUrl: string | null;
  purchasedAt: string;
}

export interface LibreriaPercorso {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  stepCount: number;
  estimatedHours: number | null;
  isCompleted: boolean;
  completedSteps: number;
}

/* ── Inclusi nel piano ──────────────────────────────────── */

export interface PlanInfo {
  plan: string;           // 'pro' | 'team' | 'pa'
  status: string;         // 'active' | 'past_due'
  currentPeriodEnd: string | null;
}

/* ── Root data ──────────────────────────────────────────── */

export interface LibreriaData {
  hasActivePlan: boolean;
  planInfo: PlanInfo | null;
  // Acquistati (single / free)
  corsi: LibreriaCorso[];
  risorse: LibreriaRisorsa[];
  percorsi: LibreriaPercorso[];
  acquistatiCount: number;
  // Inclusi nel piano (subscription)
  inclusiCorsi: LibreriaCorso[];
}
