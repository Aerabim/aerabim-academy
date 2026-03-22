/**
 * Extracts initials from a full name (max 2 characters).
 * "Stefano Russo" → "SR", "Stefano" → "ST", "" → "?"
 */
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === '') return '?';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Merges class names, filtering out falsy values.
 * cn('foo', false && 'bar', 'baz') → 'foo baz'
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Formats a price in cents to EUR display string.
 * 8900 → "89,00 €", 0 → "Gratuito"
 */
export function formatPrice(cents: number): string {
  if (cents === 0) return 'Gratuito';
  const euros = (cents / 100).toFixed(2).replace('.', ',');
  return `${euros} €`;
}

/**
 * Formats minutes to a human-readable duration.
 * 180 → "3h", 90 → "1h 30min", 45 → "45min"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

/**
 * Formats seconds to a human-readable duration.
 * 900 → "15min", 5400 → "1h 30min"
 */
export function formatDurationSec(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return formatDuration(minutes);
}

/**
 * Formats a date string to a relative "time ago" string in Italian.
 * "2026-03-22T10:00:00Z" → "2 ore fa", "3 giorni fa", "1 mese fa"
 */
export function timeAgo(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'adesso';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min fa`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return diffHours === 1 ? '1 ora fa' : `${diffHours} ore fa`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return diffDays === 1 ? '1 giorno fa' : `${diffDays} giorni fa`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return diffMonths === 1 ? '1 mese fa' : `${diffMonths} mesi fa`;

  const diffYears = Math.floor(diffMonths / 12);
  return diffYears === 1 ? '1 anno fa' : `${diffYears} anni fa`;
}
