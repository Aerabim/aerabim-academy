'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';

interface DayData {
  label: string;
  minutes: number;
}

interface WeeklyActivityProps {
  days: DayData[];
}

export function WeeklyActivity({ days }: WeeklyActivityProps) {
  const max = Math.max(...days.map((d) => d.minutes), 1);
  const totalMinutes = days.reduce((sum, d) => sum + d.minutes, 0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Card>
      <div className="px-5 pt-5">
        <div className="font-heading text-[0.98rem] font-bold text-text-primary tracking-tight">
          Attivit&agrave; Settimanale
        </div>
        <div className="text-[0.72rem] text-text-muted mt-px">
          {totalMinutes > 0
            ? `${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}min questa settimana`
            : 'Nessuna attività questa settimana'}
        </div>
      </div>
      <div ref={ref} className="px-5 pb-5 pt-4">
        <div className="flex items-end gap-1.5 h-[130px] pt-2.5">
          {days.map((day, i) => {
            const heightPct = day.minutes > 0 ? (day.minutes / max) * 100 : 3;
            return (
              <div key={day.label} className="flex-1 flex flex-col items-center gap-2 h-full">
                <div className="flex-1 w-full flex items-end justify-center">
                  <div
                    className="w-full max-w-[26px] rounded-t-[5px] rounded-b-[2px] bg-gradient-to-t from-accent-cyan/25 to-accent-cyan cursor-pointer hover:opacity-80 transition-all relative group"
                    style={{
                      height: visible ? `${heightPct}%` : '0%',
                      minHeight: visible ? '3px' : '0px',
                      transition: `height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.08}s`,
                    }}
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
