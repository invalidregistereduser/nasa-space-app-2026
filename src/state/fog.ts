import { FOG_COLS, FOG_ROWS, WORLD } from '../game/constants';

/**
 * Fog of war lives outside React state: it is mutated many times per second by
 * the Phaser scene and only read when the map is open or the game is saved.
 */
const grid = new Uint8Array(FOG_COLS * FOG_ROWS);
let version = 0;
let revealedCells = 0;

export function fogVersion() {
  return version;
}

export function fogGrid() {
  return grid;
}

export function resetFog() {
  grid.fill(0);
  revealedCells = 0;
  version++;
}

export function isRevealed(col: number, row: number) {
  if (col < 0 || row < 0 || col >= FOG_COLS || row >= FOG_ROWS) return false;
  return grid[row * FOG_COLS + col] === 1;
}

/** Marks a world-space disc as permanently discovered. Returns true if anything changed. */
export function revealDisc(worldX: number, worldY: number, radius: number) {
  const c0 = Math.max(0, Math.floor((worldX - radius) / WORLD.fogCell));
  const c1 = Math.min(FOG_COLS - 1, Math.floor((worldX + radius) / WORLD.fogCell));
  const r0 = Math.max(0, Math.floor((worldY - radius) / WORLD.fogCell));
  const r1 = Math.min(FOG_ROWS - 1, Math.floor((worldY + radius) / WORLD.fogCell));
  const rr = radius * radius;
  let changed = false;
  for (let r = r0; r <= r1; r++) {
    const cy = r * WORLD.fogCell + WORLD.fogCell * 0.5;
    for (let c = c0; c <= c1; c++) {
      const i = r * FOG_COLS + c;
      if (grid[i]) continue;
      const cx = c * WORLD.fogCell + WORLD.fogCell * 0.5;
      if ((cx - worldX) ** 2 + (cy - worldY) ** 2 <= rr) {
        grid[i] = 1;
        revealedCells++;
        changed = true;
      }
    }
  }
  if (changed) version++;
  return changed;
}

export function exploredFraction() {
  return revealedCells / grid.length;
}

/** Packs the grid into a bitset and base64-encodes it for localStorage. */
export function serializeFog(): string {
  const bytes = new Uint8Array(Math.ceil(grid.length / 8));
  for (let i = 0; i < grid.length; i++) {
    if (grid[i]) bytes[i >> 3] |= 1 << (i & 7);
  }
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function deserializeFog(encoded: string) {
  resetFog();
  try {
    const binary = atob(encoded);
    for (let i = 0; i < grid.length; i++) {
      const byte = binary.charCodeAt(i >> 3);
      if (!Number.isNaN(byte) && byte & (1 << (i & 7))) {
        grid[i] = 1;
        revealedCells++;
      }
    }
  } catch {
    resetFog();
  }
  version++;
}
