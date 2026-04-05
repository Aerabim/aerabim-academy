'use client';

import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const ACCENT = '#34d399';

const CERTIFICATIONS = [
  'UNI 11337',
  'ISO 19650',
  'BIM Manager',
  'BIM Coordinator',
  'BIM Specialist',
  'RUP / DEC',
];

export function BookExamCtaBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hoveredChip, setHoveredChip] = useState<number | null>(null);

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
        borderColor: hovered ? `${ACCENT}40` : `${ACCENT}18`,
        boxShadow: hovered
          ? `0 0 0 1px ${ACCENT}28, 0 8px 32px -8px ${ACCENT}20`
          : '0 0 0 1px transparent',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #040B11 0%, #071a12 45%, #04110c 100%)' }}
      />

      {/* Mouse-tracking radial glow */}
      <div
        className={cn(
          'absolute inset-0 pointer-events-none transition-opacity duration-300',
          hovered ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          background: `radial-gradient(520px circle at ${mouse.x}% ${mouse.y}%, ${ACCENT}18, transparent 65%)`,
        }}
      />

      {/* Static emerald glow — top right */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl opacity-15"
        style={{ background: ACCENT }}
      />

      {/* Static emerald glow — bottom left */}
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full blur-2xl opacity-8"
        style={{ background: ACCENT }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(${ACCENT} 1px, transparent 1px),
            linear-gradient(90deg, ${ACCENT} 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 h-full transition-all duration-300"
        style={{
          width: hovered ? '5px' : '4px',
          background: `linear-gradient(to bottom, ${ACCENT}, ${ACCENT}60)`,
          boxShadow: hovered ? `2px 0 12px 0 ${ACCENT}50` : 'none',
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
              style={{ color: ACCENT }}
            >
              Sessione d&apos;esame
            </p>

            <h2
              className={cn(
                'font-heading text-xl lg:text-[1.45rem] font-extrabold text-text-primary leading-tight mb-2',
                'transition-[opacity,transform] duration-500',
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
              )}
            >
              Pronto per la certificazione? Prenota il tuo esame.
            </h2>

            <p
              className={cn(
                'text-[0.82rem] text-text-secondary leading-relaxed max-w-lg mb-5',
                'transition-[opacity,transform] duration-500',
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
              )}
              style={{ transitionDelay: visible ? '100ms' : '0ms' }}
            >
              Individuiamo il provider di certificazione più adatto al tuo profilo e
              ti offriamo una tariffa agevolata. Dicci quale certificazione stai
              perseguendo e ti mettiamo in contatto con l&apos;ente giusto.
            </p>

            {/* Certification chips — stagger entrance + hover glow */}
            <div className="flex flex-wrap gap-2">
              {CERTIFICATIONS.map((cert, i) => (
                <span
                  key={cert}
                  className={cn(
                    'px-3 py-1 rounded-full text-[0.7rem] font-medium border cursor-default select-none',
                    'transition-all duration-300',
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
                    hoveredChip === i && 'scale-105',
                  )}
                  style={{
                    color: ACCENT,
                    background: hoveredChip === i ? `${ACCENT}20` : `${ACCENT}0e`,
                    borderColor: hoveredChip === i ? `${ACCENT}60` : `${ACCENT}28`,
                    boxShadow: hoveredChip === i ? `0 0 10px ${ACCENT}30` : 'none',
                    transitionDelay: visible ? `${200 + i * 60}ms` : '0ms',
                  }}
                  onMouseEnter={() => setHoveredChip(i)}
                  onMouseLeave={() => setHoveredChip(null)}
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>

          {/* Right: CTA */}
          <div className="shrink-0 flex flex-col items-start md:items-center gap-2">
            <a
              href="mailto:certificazioni@aerabim.it"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[0.85rem] font-bold transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{
                color: '#040B11',
                background: ACCENT,
                boxShadow: `0 0 24px -4px ${ACCENT}55`,
              }}
            >
              Prenota la sessione
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 7h10M8 3l4 4-4 4" />
              </svg>
            </a>
            <p className="text-[0.68rem] text-text-muted">Tariffa agevolata garantita</p>
          </div>

        </div>
      </div>
    </div>
  );
}
