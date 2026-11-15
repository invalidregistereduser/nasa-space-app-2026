/** Substitutes the player's chosen name into authored dialogue. */
export function fmt(line: string, name: string): string {
  const safe = name?.trim() || 'Astronaut';
  return line
    .replace(/\{name\}/g, safe)
    .replace(/\{NAME\}/g, safe.toUpperCase())
    .replace(/\{Name\}/g, safe.charAt(0).toUpperCase() + safe.slice(1));
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

/** Wall-clock age of a timestamp, for "saved 20 minutes ago". */
export function timeAgo(then: number): string {
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
