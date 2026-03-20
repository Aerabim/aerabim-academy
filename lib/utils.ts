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
