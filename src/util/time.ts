/**
 * Sol helpers.
 *
 * The surface is always in daylight: sols still advance (crops and the HUD need
 * them) but the sun never sets, so there is no night cycle to render.
 */

/** Solar intensity across a sol. Dips gently morning and evening, never dark. */
export function daylight(solTime: number): number {
  const t = ((solTime % 1) + 1) % 1;
  return 0.62 + Math.sin(t * Math.PI * 2 - Math.PI / 2) * 0.19 + 0.19;
}

/** Friendly label for the current part of the sol. */
export function solPhase(solTime: number): string {
  const t = ((solTime % 1) + 1) % 1;
  if (t < 0.3) return 'MORNING';
  if (t < 0.55) return 'MIDDAY';
  if (t < 0.8) return 'AFTERNOON';
  return 'GOLDEN HOUR';
}

/** Martian clock readout — a sol is divided into 24 Mars hours of 24h39m35s. */
export function solClock(solTime: number): string {
  const total = ((solTime % 1) + 1) % 1;
  // Map the sol onto a pleasant 07:00 - 19:00 working day.
  const hours = 7 + total * 12;
  const h = Math.floor(hours);
  const m = Math.floor((hours % 1) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Surface temperature estimate in Celsius, for flavour and the HUD. */
export function surfaceTemp(solTime: number): number {
  return Math.round(-32 + daylight(solTime) * 48);
}
