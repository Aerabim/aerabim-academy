import type { AreaCode, LevelCode, LessonType, AccentColor } from '@/types';

// ── Area Configuration ──────────────────────────────

export interface AreaConfig {
  label: string;
  fullLabel: string;
  badgeVariant: AccentColor;
  cardGradient: string;
  emoji: string;
}

export const AREA_CONFIG: Record<AreaCode, AreaConfig> = {
  SW: {
    label: 'SW',
    fullLabel: 'Software Operativo',
    badgeVariant: 'cyan',
    cardGradient: 'from-[#0a1e38] via-[#16416e] to-[#0f2d50]',
    emoji: '🏗️',
  },
  NL: {
    label: 'NL',
    fullLabel: 'Normativa & Legal',
    badgeVariant: 'violet',
    cardGradient: 'from-[#1e0a38] via-[#3e166e] to-[#2a0f50]',
    emoji: '⚖️',
  },
  OB: {
    label: 'OB',
    fullLabel: 'OpenBIM & Standard',
    badgeVariant: 'emerald',
    cardGradient: 'from-[#0a3820] via-[#166e3e] to-[#0f5030]',
    emoji: '📐',
  },
  PG: {
    label: 'PG',
    fullLabel: 'Processi & Governance',
    badgeVariant: 'amber',
    cardGradient: 'from-[#2e1a08] via-[#5c3610] to-[#40260c]',
    emoji: '📋',
  },
  AI: {
    label: 'AI',
    fullLabel: 'AI & Automazione',
    badgeVariant: 'cyan',
    cardGradient: 'from-[#0a2e38] via-[#165e6e] to-[#0f4050]',
    emoji: '🤖',
  },
};

// ── Level Labels ────────────────────────────────────

export const LEVEL_LABELS: Record<LevelCode, string> = {
  L1: 'Base',
  L2: 'Intermedio',
  L3: 'Avanzato',
};

export const LEVEL_COLORS: Record<LevelCode, string> = {
  L1: 'bg-accent-emerald/20 text-accent-emerald',
  L2: 'bg-accent-amber/20 text-accent-amber',
  L3: 'bg-rose-500/20 text-rose-400',
};

// ── Lesson Type Config ──────────────────────────────

export interface LessonTypeConfig {
  label: string;
  badgeVariant: AccentColor;
}

export const LESSON_TYPE_CONFIG: Record<LessonType, LessonTypeConfig> = {
  video: { label: 'Video', badgeVariant: 'cyan' },
  quiz: { label: 'Quiz', badgeVariant: 'amber' },
  esercitazione: { label: 'Esercitazione', badgeVariant: 'emerald' },
};

// ── Category Filter Options ─────────────────────────

export type CategoryFilterValue = AreaCode | 'all';

export const CATEGORY_OPTIONS: { value: CategoryFilterValue; label: string }[] = [
  { value: 'all', label: 'Tutti i Corsi' },
  { value: 'SW', label: 'Software Operativo (SW)' },
  { value: 'NL', label: 'Normativa & Legal (NL)' },
  { value: 'OB', label: 'OpenBIM & Standard (OB)' },
  { value: 'PG', label: 'Processi & Governance (PG)' },
  { value: 'AI', label: 'AI & Automazione (AI)' },
];
