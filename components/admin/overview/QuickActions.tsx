import Link from 'next/link';

interface QuickAction {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const ACTIONS: QuickAction[] = [
  {
    href: '/admin/corsi/nuovo',
    label: 'Nuovo corso',
    description: 'Crea e pubblica',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        <line x1="12" y1="8" x2="12" y2="14" />
        <line x1="9"  y1="11" x2="15" y2="11" />
      </svg>
    ),
  },
  {
    href: '/admin/utenti',
    label: 'Utenti',
    description: 'Gestisci e cerca',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    href: '/admin/richieste-sessioni',
    label: 'Richieste',
    description: 'Sessioni in attesa',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    href: '/admin/analytics',
    label: 'Analytics',
    description: 'Report e dati',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="group flex items-center gap-3 bg-surface-1 border border-border-subtle hover:border-border-hover rounded-lg px-4 py-3 transition-colors"
        >
          <span className="w-8 h-8 rounded-md bg-surface-3 flex items-center justify-center shrink-0 text-text-secondary group-hover:text-text-primary group-hover:bg-surface-4 transition-colors">
            {action.icon}
          </span>
          <div className="min-w-0">
            <div className="text-[0.8rem] font-semibold text-text-primary leading-tight truncate">
              {action.label}
            </div>
            <div className="text-[0.68rem] text-text-muted leading-tight truncate">
              {action.description}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
