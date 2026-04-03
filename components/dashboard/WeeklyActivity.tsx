'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';

interface DayData {
  label: string;
  minutes: number;
}

interface WeeklyActivityProps {
  days: DayData[];
  prevWeekMinutes: number;
}

export function WeeklyActivity({ days, prevWeekMinutes }: WeeklyActivityProps) {
  const max = Math.max(...days.map((d) => d.minutes), 1);
  const totalMinutes = days.reduce((sum, d) => sum + d.minutes, 0);
  const bestDay = days.reduce((best, d) => (d.minutes > best.minutes ? d : best), days[0]);
  const todayIndex = (new Date().getDay() + 6) % 7; // Lun=0 … Dom=6

  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - todayIndex);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekNumber = (() => {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  })();
  const fmt = (d: Date) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  const weekRange = `${fmt(monday)} – ${fmt(sunday)}`;
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
        <div className="flex items-baseline gap-2">
          <div className="font-heading text-[0.98rem] font-bold text-text-primary tracking-tight">
            Attivit&agrave; Settimanale
          </div>
          <span className="font-heading text-[0.7rem] font-semibold text-text-muted">
            Sett. {weekNumber} · {weekRange}
          </span>
        </div>
        <div className="text-[0.72rem] text-text-muted mt-px">
          {totalMinutes > 0
            ? `${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}min questa settimana`
            : 'Nessuna attività questa settimana'}
        </div>
        {totalMinutes > 0 && (
          <div className="text-[0.7rem] text-accent-cyan mt-0.5">
            Miglior giorno: {bestDay.label} ({bestDay.minutes} min)
          </div>
        )}
        {(() => {
          if (totalMinutes === 0 && prevWeekMinutes === 0) return null;
          if (prevWeekMinutes === 0) return (
            <div className="text-[0.7rem] text-accent-emerald mt-0.5">
              Prima settimana di attività registrata
            </div>
          );
          const diff = totalMinutes - prevWeekMinutes;
          const pct = Math.round(Math.abs(diff) / prevWeekMinutes * 100);
          const up = diff >= 0;
          return (
            <div className={`text-[0.7rem] mt-0.5 ${up ? 'text-accent-emerald' : 'text-accent-rose'}`}>
              {up ? '↑' : '↓'} {pct}% rispetto alla settimana scorsa
            </div>
          );
        })()}
      </div>
      <div ref={ref} className="px-5 pb-5 pt-4">
        <div className="flex items-end gap-1.5 h-[130px] pt-2.5">
          {days.map((day, i) => {
            const heightPct = day.minutes > 0 ? (day.minutes / max) * 100 : 3;
            return (
              <div key={day.label} className="flex-1 flex flex-col items-center gap-2 h-full">
                <div className="flex-1 w-full flex items-end justify-center">
                  <div
                    className={`w-full max-w-[26px] rounded-t-[5px] rounded-b-[2px] cursor-pointer hover:opacity-80 transition-all relative group ${i === todayIndex ? 'bg-gradient-to-t from-accent-amber/25 to-accent-amber' : 'bg-gradient-to-t from-accent-cyan/25 to-accent-cyan'}`}
                    style={{
                      height: visible ? `${heightPct}%` : '0%',
                      minHeight: visible ? '3px' : '0px',
                      transition: `height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.08}s`,
                    }}
                  >
                    <span className={`absolute -top-5 left-1/2 -translate-x-1/2 font-heading text-[0.62rem] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${i === todayIndex ? 'text-accent-amber' : 'text-accent-cyan'}`}>
                      {day.minutes} min
                    </span>
                  </div>
                </div>
                <span className={`font-heading text-[0.62rem] font-semibold ${i === todayIndex ? 'text-accent-amber' : 'text-text-muted'}`}>
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
