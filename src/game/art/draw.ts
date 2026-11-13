/** Low-level canvas helpers shared by every generated texture. */

export type Ctx = CanvasRenderingContext2D;

/** Deterministic PRNG (mulberry32) so the world looks the same every run. */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth, tileable value noise. */
export function makeNoise(seed: number, period = 16) {
  const rng = makeRng(seed);
  const grid = new Float32Array(period * period);
  for (let i = 0; i < grid.length; i++) grid[i] = rng();

  const at = (x: number, y: number) => {
    const xi = ((x % period) + period) % period;
    const yi = ((y % period) + period) % period;
    return grid[yi * period + xi];
  };
  const smooth = (t: number) => t * t * (3 - 2 * t);

  return (x: number, y: number) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = smooth(x - x0);
    const fy = smooth(y - y0);
    const a = at(x0, y0);
    const b = at(x0 + 1, y0);
    const c = at(x0, y0 + 1);
    const d = at(x0 + 1, y0 + 1);
    return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
  };
}

/** Fractal (multi-octave) tileable noise in 0..1. */
export function makeFbm(seed: number, octaves = 4, period = 8) {
  const layers = Array.from({ length: octaves }, (_, i) => ({
    noise: makeNoise(seed + i * 977, period * 2 ** i),
    freq: 2 ** i,
    amp: 1 / 2 ** i,
  }));
  const norm = layers.reduce((sum, l) => sum + l.amp, 0);
  return (x: number, y: number) => {
    let v = 0;
    for (const l of layers) v += l.noise(x * l.freq, y * l.freq) * l.amp;
    return v / norm;
  };
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function fillRoundRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string | CanvasGradient,
) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Capsule limb drawn as a thick round-capped line. */
export function capsule(
  ctx: Ctx,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  stroke: string | CanvasGradient,
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = stroke;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function vGrad(ctx: Ctx, x: number, y0: number, y1: number, stops: [number, string][]) {
  void x;
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([pos, color]) => g.addColorStop(pos, color));
  return g;
}

export function hGrad(ctx: Ctx, x0: number, x1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  stops.forEach(([pos, color]) => g.addColorStop(pos, color));
  return g;
}

export function rGrad(
  ctx: Ctx,
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  stops: [number, string][],
  ox = cx,
  oy = cy,
) {
  const g = ctx.createRadialGradient(ox, oy, r0, cx, cy, r1);
  stops.forEach(([pos, color]) => g.addColorStop(pos, color));
  return g;
}

/** Soft contact shadow under an object. */
export function groundShadow(
  ctx: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  alpha = 0.35,
) {
  const g = rGrad(ctx, cx, cy, 0, Math.max(rx, ry), [
    [0, `rgba(24,10,4,${alpha})`],
    [0.55, `rgba(24,10,4,${alpha * 0.55})`],
    [1, 'rgba(24,10,4,0)'],
  ]);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / Math.max(rx, 0.001));
  ctx.translate(-cx, -cy);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Irregular closed blob — the basis for rocks and craters. */
export function blobPath(
  ctx: Ctx,
  cx: number,
  cy: number,
  radius: number,
  rng: () => number,
  points = 9,
  irregularity = 0.28,
  squash = 1,
) {
  const pts: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = radius * (1 - irregularity + rng() * irregularity * 2);
    pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * squash]);
  }
  ctx.beginPath();
  for (let i = 0; i <= pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length];
    const p1 = pts[i % pts.length];
    const mid: [number, number] = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
    if (i === 0) ctx.moveTo(mid[0], mid[1]);
    else ctx.quadraticCurveTo(p0[0], p0[1], mid[0], mid[1]);
  }
  ctx.closePath();
  return pts;
}

/** Scatters tiny grains to break up flat fills. */
export function speckle(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  count: number,
  colors: string[],
  rng: () => number,
  maxSize = 1.6,
) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[Math.floor(rng() * colors.length)];
    const s = 0.4 + rng() * maxSize;
    ctx.fillRect(x + rng() * w, y + rng() * h, s, s);
  }
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function rgba(hex: number, alpha: number) {
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function mixHex(a: number, b: number, t: number) {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

export function hexStr(hex: number) {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

/** Creates (or reuses) a canvas-backed Phaser texture. */
export function canvasTex(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (ctx: Ctx, w: number, h: number) => void,
): Phaser.Textures.CanvasTexture | null {
  if (scene.textures.exists(key)) {
    return scene.textures.get(key) as Phaser.Textures.CanvasTexture;
  }
  const texture = scene.textures.createCanvas(key, Math.ceil(w), Math.ceil(h));
  if (!texture) return null;
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, w, h);
  draw(ctx, w, h);
  texture.refresh();
  return texture;
}
