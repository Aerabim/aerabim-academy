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
