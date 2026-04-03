'use client';

import { useState, useEffect } from 'react';
import { timeAgo } from '@/lib/utils';

interface RelativeTimeProps {
  date: string;
  className?: string;
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const [label, setLabel] = useState(() => timeAgo(date));

  useEffect(() => {
    const id = setInterval(() => setLabel(timeAgo(date)), 60_000);
    return () => clearInterval(id);
  }, [date]);

  return (
    <time dateTime={date} className={className} title={new Date(date).toLocaleString('it-IT')}>
      {label}
    </time>
  );
}
