'use client';

import { useEffect, useRef, useState } from 'react';

interface StatItem {
  label: string;
  target: number;
  change: string;
  color: 'cyan' | 'amber' | 'emerald' | 'rose';
  icon: React.ReactNode;
}

const STATS: StatItem[] = [
  {
    label: 'Corsi Attivi',
    target: 4,
    change: 'su 12 disponibili',
    color: 'cyan',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    label: 'Ore di Studio',
    target: 18,
    change: '+4.2h vs settimana scorsa',
    color: 'amber',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    label: 'Quiz Superati',
    target: 11,
    change: 'media score: 87%',
    color: 'emerald',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    ),
  },
  {
    label: 'Certificati',
    target: 2,
    change: '+1 questo mese',
    color: 'rose',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="7" />
        <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
      </svg>
    ),
  },
];

const COLOR_MAP = {
  cyan: {
    topBorder: 'before:bg-gradient-to-r before:from-accent-cyan before:to-transparent',
    iconBg: 'bg-accent-cyan/10 text-accent-cyan',
    value: 'text-accent-cyan',
  },
  amber: {
    topBorder: 'before:bg-gradient-to-r before:from-accent-amber before:to-transparent',
    iconBg: 'bg-accent-amber/10 text-accent-amber',
    value: 'text-accent-amber',
  },
  emerald: {
    topBorder: 'before:bg-gradient-to-r before:from-accent-emerald before:to-transparent',
    iconBg: 'bg-accent-emerald/10 text-accent-emerald',
    value: 'text-accent-emerald',
  },
  rose: {
    topBorder: 'before:bg-gradient-to-r before:from-accent-rose before:to-transparent',
    iconBg: 'bg-accent-rose/10 text-accent-rose',
    value: 'text-accent-rose',
  },
};

function AnimatedCounter({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        ref.current = requestAnimationFrame(tick);
      }
    }

    ref.current = requestAnimationFrame(tick);
    return () => {
      if (ref.current !== null) cancelAnimationFrame(ref.current);
    };
  }, [target]);

  return <>{value}</>;
}

export function StatsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {STATS.map((stat) => {
        const colors = COLOR_MAP[stat.color];
        return (
          <div
            key={stat.label}
            className={`relative overflow-hidden bg-surface-1 border border-border-subtle rounded-md px-5 py-5 hover:border-border-hover hover:-translate-y-0.5 transition-all before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] ${colors.topBorder}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-heading text-[0.7rem] uppercase tracking-wider text-text-muted font-bold">
                {stat.label}
              </span>
              <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${colors.iconBg}`}>
                {stat.icon}
              </div>
            </div>
            <div className={`font-heading text-[1.75rem] font-extrabold tracking-tighter leading-none mb-1 ${colors.value}`}>
              <AnimatedCounter target={stat.target} />
            </div>
            <div className="text-[0.72rem] text-text-muted">
              {stat.change}
            </div>
          </div>
        );
      })}
    </div>
  );
}
