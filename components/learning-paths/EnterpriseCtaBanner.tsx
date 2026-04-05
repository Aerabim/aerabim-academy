'use client';

import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const FEATURES = [
  'Percorsi su misura',
  'Licenze gruppo',
  'Trainer dedicato',
  'Certificazioni brandizzate',
];

const STATS = [
  { value: 50, suffix: '+', label: 'PA e aziende formate' },
  { value: 15, suffix: '+', label: 'corsi custom erogati' },
  { value: 98, suffix: '%', label: 'clienti soddisfatti' },
];

export function EnterpriseCtaBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hoveredChip, setHoveredChip] = useState<number | null>(null);
  const [counters, setCounters] = useState(STATS.map(() => 0));

  /* Trigger entrance + counters when scrolled into view */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* Animate counters once visible */
  useEffect(() => {
    if (!visible) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const duration = 1400;
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCounters(STATS.map((s) => Math.round(s.value * eased)));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [visible]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-xl border transition-[border-color,box-shadow] duration-300"
      style={{
        borderColor: hovered ? '#F0A50040' : '#F0A50020',
        boxShadow: hovered
          ? '0 0 0 1px #F0A50030, 0 8px 32px -8px #F0A50028'
          : '0 0 0 1px transparent',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #040B11 0%, #0f1408 45%, #0c1205 100%)' }}
      />

      {/* Mouse-tracking radial glow */}
      <div
        className={cn(
          'absolute inset-0 pointer-events-none transition-opacity duration-300',
          hovered ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          background: `radial-gradient(520px circle at ${mouse.x}% ${mouse.y}%, #F0A5001c, transparent 65%)`,
        }}
      />

      {/* Static amber glow — top right */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl opacity-20"
        style={{ background: '#F0A500' }}
      />

      {/* Static amber glow — bottom left */}
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full blur-2xl opacity-10"
        style={{ background: '#F0A500' }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(#F0A500 1px, transparent 1px),
            linear-gradient(90deg, #F0A500 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 h-full transition-all duration-300"
        style={{
          width: hovered ? '5px' : '4px',
          background: 'linear-gradient(to bottom, #F0A500, #F0A50060)',
          boxShadow: hovered ? '2px 0 12px 0 #F0A50050' : 'none',
        }}
      />

      {/* Content */}
      <div className="relative px-8 py-8 lg:px-10 lg:py-9 pl-10">
        <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-10">

          {/* Left: text — parallax on hover */}
          <div
            className="flex-1 min-w-0 transition-transform duration-200 ease-out"
            style={{
              transform: hovered
                ? `translate(${(mouse.x - 50) * -0.022}%, ${(mouse.y - 50) * -0.016}%)`
                : 'translate(0,0)',
            }}
          >
            <p
              className="text-[0.68rem] font-bold uppercase tracking-widest mb-2"
              style={{ color: '#F0A500' }}
            >
              Enterprise
            </p>

            <h2 className={cn(
              'font-heading text-xl lg:text-[1.45rem] font-extrabold text-text-primary leading-tight mb-2',
              'transition-[opacity,transform] duration-500',
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
            )}>
              Formazione su misura per la tua organizzazione
            </h2>

            <p
              className={cn(
                'text-[0.82rem] text-text-secondary leading-relaxed max-w-lg mb-5',
                'transition-[opacity,transform] duration-500',
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
              )}
              style={{ transitionDelay: visible ? '100ms' : '0ms' }}
            >
              Progettiamo percorsi BIM personalizzati per enti pubblici, studi di progettazione
              e imprese di costruzione — con contenuti, ritmi e certificazioni adattati
              agli obiettivi specifici del tuo team.
            </p>

            {/* Feature chips — stagger entrance + hover glow */}
            <div className="flex flex-wrap gap-2 mb-7">
              {FEATURES.map((f, i) => (
                <span
                  key={f}
                  className={cn(
                    'px-3 py-1 rounded-full text-[0.7rem] font-medium border cursor-default select-none',
                    'transition-all duration-300',
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
                    hoveredChip === i && 'scale-105',
                  )}
                  style={{
                    color: '#F0A500',
                    background: hoveredChip === i ? '#F0A50022' : '#F0A50010',
                    borderColor: hoveredChip === i ? '#F0A50060' : '#F0A50028',
                    boxShadow: hoveredChip === i ? '0 0 10px #F0A50035' : 'none',
                    transitionDelay: visible ? `${200 + i * 70}ms` : '0ms',
                  }}
                  onMouseEnter={() => setHoveredChip(i)}
                  onMouseLeave={() => setHoveredChip(null)}
                >
                  {f}
                </span>
              ))}
            </div>

            {/* Stats row — entrance after chips */}
            <div
              className={cn(
                'flex flex-wrap gap-7 transition-[opacity,transform] duration-500',
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
              )}
              style={{ transitionDelay: visible ? '500ms' : '0ms' }}
            >
              {STATS.map((stat, i) => (
                <div key={i}>
                  <div
                    className="font-heading text-2xl font-extrabold tabular-nums leading-none"
                    style={{ color: '#F0A500' }}
                  >
                    {counters[i]}{stat.suffix}
                  </div>
                  <div className="text-[0.68rem] text-text-muted mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: CTA */}
          <div className="shrink-0 flex flex-col items-start md:items-center gap-2">
            <a
              href="mailto:formazione@aerabim.it"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[0.85rem] font-bold transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{
                color: '#040B11',
                background: '#F0A500',
                boxShadow: '0 0 24px -4px #F0A50060',
              }}
            >
              Contattaci
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 7h10M8 3l4 4-4 4" />
              </svg>
            </a>
            <p className="text-[0.68rem] text-text-muted">Risposta entro 24h</p>
          </div>

        </div>
      </div>
    </div>
  );
}
