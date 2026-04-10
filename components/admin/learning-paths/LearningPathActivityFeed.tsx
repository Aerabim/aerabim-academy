import type { AdminLearningPathActivityItem } from '@/lib/admin/queries';

interface LearningPathActivityFeedProps {
  items: AdminLearningPathActivityItem[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function initial(name: string, email: string): string {
  const src = name && name !== 'Utente' && name !== 'Sistema' ? name : email;
  return (src.charAt(0) || '?').toUpperCase();
}

export function LearningPathActivityFeed({ items }: LearningPathActivityFeedProps) {
  if (items.length === 0) {
    return (
      <p className="text-[0.82rem] text-text-muted py-6 text-center">
        Nessuna attività registrata per questo percorso.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      <h2 className="text-[1rem] font-heading font-semibold text-text-primary mb-5">
        Attività recente
      </h2>

      <ol className="relative border-l border-border-subtle ml-3 space-y-0">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <li key={item.id} className={isLast ? 'ml-6' : 'ml-6 pb-5'}>
              {/* Timeline dot / avatar */}
              <span className="absolute -left-3 flex items-center justify-center">
                {item.type === 'created' ? (
                  <span className="w-6 h-6 rounded-full bg-surface-2 border border-border-subtle flex items-center justify-center">
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-accent-amber">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
                    <span className="text-[0.6rem] font-bold text-accent-cyan">
                      {initial(item.userName, item.userEmail)}
                    </span>
                  </span>
                )}
              </span>

              <div className="flex items-baseline gap-2 flex-wrap">
                {item.type === 'created' ? (
                  <span className="text-[0.82rem] text-text-secondary">
                    Percorso creato
                  </span>
                ) : (
                  <>
                    <span className="text-[0.82rem] font-medium text-text-primary">
                      {item.userName}
                    </span>
                    {item.userEmail && item.userName !== item.userEmail && (
                      <span className="text-[0.72rem] text-text-muted truncate max-w-[180px]">
                        {item.userEmail}
                      </span>
                    )}
                    <span className="text-[0.78rem] text-text-secondary">si è iscritto/a</span>
                  </>
                )}
                <time className="text-[0.72rem] text-text-muted ml-auto shrink-0">
                  {formatDate(item.date)}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
