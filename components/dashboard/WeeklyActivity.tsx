'use client';

import { Card } from '@/components/ui/Card';

const DAYS = [
  { label: 'Lun', minutes: 42 },
  { label: 'Mar', minutes: 28 },
  { label: 'Mer', minutes: 65 },
  { label: 'Gio', minutes: 51 },
  { label: 'Ven', minutes: 37 },
  { label: 'Sab', minutes: 18 },
  { label: 'Dom', minutes: 0 },
];

const MAX = Math.max(...DAYS.map((d) => d.minutes), 1);

export function WeeklyActivity() {
  return (
    <Card>
      <div className="px-5 pt-5">
        <div className="font-heading text-[0.98rem] font-bold text-text-primary tracking-tight">
          Attivit&agrave; Settimanale
        </div>
        <div className="text-[0.72rem] text-text-muted mt-px">
          Minuti di studio per giorno
        </div>
      </div>
      <div className="px-5 pb-5 pt-4">
        <div className="flex items-end gap-1.5 h-[130px] pt-2.5">
          {DAYS.map((day) => {
            const heightPct = day.minutes > 0 ? (day.minutes / MAX) * 100 : 3;
            return (
              <div key={day.label} className="flex-1 flex flex-col items-center gap-2 h-full">
                <div className="flex-1 w-full flex items-end justify-center">
                  <div
                    className="w-full max-w-[26px] rounded-t-[5px] rounded-b-[2px] bg-gradient-to-t from-accent-cyan/25 to-accent-cyan cursor-pointer hover:opacity-80 transition-opacity relative group"
                    style={{ height: `${heightPct}%`, minHeight: '3px' }}
                  >
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-heading text-[0.62rem] font-bold text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {day.minutes} min
                    </span>
                  </div>
                </div>
                <span className="font-heading text-[0.62rem] text-text-muted font-semibold">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
