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
