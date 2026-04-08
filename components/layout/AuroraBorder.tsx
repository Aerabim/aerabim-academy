/**
 * AuroraBorder — striscia animata sul bordo destro della sidebar.
 * Per rimuoverla: impostare AURORA_ENABLED = false in Sidebar.tsx,
 * poi cancellare questo file e il keyframe 'aurora' in tailwind.config.ts.
 */
export function AuroraBorder({ variant = 'cyan' }: { variant?: 'cyan' | 'amber' }) {
  const gradient = variant === 'amber'
    ? 'linear-gradient(180deg, transparent 0%, #F0A500 20%, #E8505B 45%, #A06BD6 70%, #F0A500 85%, transparent 100%)'
    : 'linear-gradient(180deg, transparent 0%, #4ECDC4 20%, #A06BD6 45%, #2ECC71 70%, #4ECDC4 85%, transparent 100%)';

  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-[2px] pointer-events-none"
      style={{
        background: gradient,
        backgroundSize: '100% 300%',
        animation: 'aurora 6s ease-in-out infinite',
        opacity: 0.7,
      }}
    />
  );
}
