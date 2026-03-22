interface StatsGridProps {
  activeCourses: number;
  totalCourses: number;
  studyHours: number;
  quizzesPassed: number;
  avgScore: number;
  certificates: number;
}

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

export function StatsGrid({
  activeCourses,
  totalCourses,
  studyHours,
  quizzesPassed,
  avgScore,
  certificates,
}: StatsGridProps) {
  const stats = [
    {
      label: 'Corsi Attivi',
      value: activeCourses,
      change: totalCourses > 0 ? `su ${totalCourses} disponibili` : 'nessun corso disponibile',
      color: 'cyan' as const,
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      ),
    },
    {
      label: 'Ore di Studio',
      value: studyHours,
      change: 'tempo totale',
      color: 'amber' as const,
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      label: 'Quiz Superati',
      value: quizzesPassed,
      change: avgScore > 0 ? `media score: ${avgScore}%` : 'nessun quiz completato',
      color: 'emerald' as const,
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <path d="M22 4L12 14.01l-3-3" />
        </svg>
      ),
    },
    {
      label: 'Certificati',
      value: certificates,
      change: certificates > 0 ? `${certificates} ottenut${certificates === 1 ? 'o' : 'i'}` : 'completa un corso',
      color: 'rose' as const,
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="7" />
          <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {stats.map((stat) => {
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
              {stat.value}
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
