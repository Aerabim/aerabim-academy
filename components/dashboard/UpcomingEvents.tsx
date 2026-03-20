import { Card } from '@/components/ui/Card';

const EVENTS = [
  {
    day: '12',
    month: 'Mar',
    title: 'Q&A: BIM 2026',
    desc: 'Live con Stefano · 17:00',
    live: false,
  },
  {
    day: '19',
    month: 'Mar',
    title: 'Clash Detection',
    desc: 'Webinar · 15:00',
    live: false,
  },
  {
    day: '26',
    month: 'Mar',
    title: 'Office Hour',
    desc: 'Domande libere · 18:00',
    live: true,
  },
];

export function UpcomingEvents() {
  return (
    <Card>
      <div className="px-5 pt-5">
        <div className="font-heading text-[0.98rem] font-bold text-text-primary tracking-tight">
          Prossimi Eventi
        </div>
        <div className="text-[0.72rem] text-text-muted mt-px">
          Sessioni live
        </div>
      </div>
      <div className="px-5 pb-5 pt-4 flex flex-col gap-2">
        {EVENTS.map((event) => (
          <div
            key={event.title}
            className="flex items-center gap-3 p-3 bg-surface-2 rounded-sm border border-transparent hover:bg-surface-3 hover:border-border-subtle transition-all cursor-pointer"
          >
            <div className="w-[46px] h-[46px] rounded-sm bg-accent-cyan-dim flex flex-col items-center justify-center shrink-0">
              <span className="font-heading text-[1.05rem] font-extrabold text-accent-cyan leading-none">
                {event.day}
              </span>
              <span className="font-heading text-[0.55rem] uppercase text-text-muted font-bold">
                {event.month}
              </span>
            </div>
            <div>
              <div className="text-[0.8rem] font-semibold text-text-primary flex items-center gap-2">
                {event.live && (
                  <span className="inline-flex items-center gap-1 font-heading text-[0.58rem] font-extrabold text-accent-rose uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-rose animate-pulse" />
                    LIVE
                  </span>
                )}
                {event.title}
              </div>
              <div className="text-[0.7rem] text-text-muted mt-0.5">
                {event.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
