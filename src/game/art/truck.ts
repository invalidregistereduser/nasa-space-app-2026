import Phaser from 'phaser';
import { fillRoundRect, makeRng, speckle, vGrad, type Ctx } from './draw';

/**
 * The surface truck: a six-wheeled pressurised rover the astronaut can drive.
 * Four facings down the rows (matching the astronaut sheet order) and three
 * frames across for the wheels turning.
 */
export const TRUCK_W = 112;
export const TRUCK_H = 92;
export const TRUCK_COLS = 3;
export const TRUCK_DIRS = ['down', 'left', 'right', 'up'] as const;
export type TruckDir = (typeof TRUCK_DIRS)[number];

const BODY_LIGHT = '#f0f3f7';
const BODY_MID = '#cdd6e0';
const BODY_SHADE = '#9aa7b6';
const BODY_DARK = '#5d6a7a';
const TYRE = '#22262c';
const TYRE_LIGHT = '#3b424b';
const GLASS = '#1d3d52';
const TRIM = '#c1440e';

function wheel(ctx: Ctx, x: number, y: number, w: number, h: number, phase: number) {
  fillRoundRect(ctx, x, y, w, h, Math.min(w, h) * 0.42, TYRE);
  ctx.save();
  ctx.strokeStyle = TYRE_LIGHT;
  ctx.lineWidth = 1.6;
  // Tread marks march along the wheel so it reads as rolling.
  for (let i = 0; i < 3; i++) {
    const t = ((i / 3 + phase) % 1) * h;
    ctx.beginPath();
    ctx.moveTo(x + 1.5, y + t);
    ctx.lineTo(x + w - 1.5, y + t);
    ctx.stroke();
  }
  ctx.restore();
}

function wheelSide(ctx: Ctx, cx: number, cy: number, r: number, phase: number) {
  ctx.save();
  ctx.fillStyle = TYRE;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7d8795';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = TYRE_LIGHT;
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 5; i++) {
    const a = phase * Math.PI * 2 + (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5);
    ctx.lineTo(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92);
    ctx.stroke();
  }
  ctx.restore();
}

function shadow(ctx: Ctx, cx: number, cy: number, rx: number, ry: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(32,14,6,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Seen from behind or in front: a wide cab with wheels down both sides. */
function drawFrontBack(ctx: Ctx, phase: number, front: boolean) {
  const cx = TRUCK_W / 2;
  shadow(ctx, cx, TRUCK_H - 10, 44, 10);

  // Wheels either side.
  [0, 1, 2].forEach((i) => {
    const y = 30 + i * 18;
    wheel(ctx, 12, y, 13, 17, (phase + i * 0.2) % 1);
    wheel(ctx, TRUCK_W - 25, y, 13, 17, (phase + i * 0.2) % 1);
  });

  // Chassis.
  fillRoundRect(ctx, 22, 26, TRUCK_W - 44, 54, 9, BODY_SHADE);

  // Cab.
  const body = vGrad(ctx, 0, 18, 72, [
    [0, BODY_LIGHT],
    [0.55, BODY_MID],
    [1, BODY_SHADE],
  ]);
  fillRoundRect(ctx, 25, 18, TRUCK_W - 50, 50, 11, body);

  // Roof rack / solar strip.
  fillRoundRect(ctx, 33, 12, TRUCK_W - 66, 12, 5, BODY_DARK);
  fillRoundRect(ctx, 36, 14, TRUCK_W - 72, 8, 3, '#2b4e66');

  if (front) {
    // Windscreen and lamps.
    fillRoundRect(ctx, 33, 24, TRUCK_W - 66, 22, 7, GLASS);
    ctx.save();
    ctx.fillStyle = 'rgba(190,235,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(35, 44);
    ctx.lineTo(56, 25);
    ctx.lineTo(66, 25);
    ctx.lineTo(42, 44);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    [36, TRUCK_W - 44].forEach((x) => {
      fillRoundRect(ctx, x, 52, 20, 9, 4, '#ffe6b0');
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#fff3d0';
      ctx.beginPath();
      ctx.ellipse(x + 10, 60, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  } else {
    // Rear hatch, ladder and tail lamps.
    fillRoundRect(ctx, 34, 26, TRUCK_W - 68, 28, 6, BODY_SHADE);
    ctx.strokeStyle = BODY_DARK;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(48, 32 + i * 8);
      ctx.lineTo(TRUCK_W - 48, 32 + i * 8);
      ctx.stroke();
    }
    [34, TRUCK_W - 48].forEach((x) => fillRoundRect(ctx, x, 56, 14, 7, 3, '#c33a22'));
  }

  // Mission stripe.
  fillRoundRect(ctx, 25, 66, TRUCK_W - 50, 5, 2, TRIM);
}

/** Seen from the side: long wheelbase, cab forward, cargo deck behind. */
function drawSide(ctx: Ctx, phase: number, facingRight: boolean) {
  ctx.save();
  if (!facingRight) {
    ctx.translate(TRUCK_W, 0);
    ctx.scale(-1, 1);
  }

  shadow(ctx, TRUCK_W / 2, TRUCK_H - 12, 48, 9);

  // Wheels.
  [24, 54, 84].forEach((x, i) => wheelSide(ctx, x, TRUCK_H - 20, 11, (phase + i * 0.12) % 1));

  // Deck and chassis.
  fillRoundRect(ctx, 12, TRUCK_H - 40, 90, 16, 5, BODY_DARK);

  // Cargo bed at the back.
  fillRoundRect(ctx, 14, TRUCK_H - 56, 44, 18, 5, BODY_SHADE);
  ctx.strokeStyle = BODY_DARK;
  ctx.lineWidth = 1.3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(20 + i * 12, TRUCK_H - 54);
    ctx.lineTo(20 + i * 12, TRUCK_H - 40);
    ctx.stroke();
  }

  // Cab.
  const body = vGrad(ctx, 0, TRUCK_H - 72, 34, [
    [0, BODY_LIGHT],
    [0.6, BODY_MID],
    [1, BODY_SHADE],
  ]);
  fillRoundRect(ctx, 56, TRUCK_H - 72, 46, 34, 9, body);

  // Window.
  fillRoundRect(ctx, 64, TRUCK_H - 67, 32, 17, 6, GLASS);
  ctx.save();
  ctx.fillStyle = 'rgba(190,235,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(66, TRUCK_H - 51);
  ctx.lineTo(82, TRUCK_H - 65);
  ctx.lineTo(89, TRUCK_H - 65);
  ctx.lineTo(73, TRUCK_H - 51);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Lamp and stripe.
  fillRoundRect(ctx, 98, TRUCK_H - 50, 7, 8, 3, '#ffe6b0');
  fillRoundRect(ctx, 56, TRUCK_H - 44, 46, 4, 2, TRIM);

  // Roof aerial.
  ctx.strokeStyle = BODY_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(72, TRUCK_H - 72);
  ctx.lineTo(68, TRUCK_H - 86);
  ctx.stroke();
  ctx.fillStyle = TRIM;
  ctx.beginPath();
  ctx.arc(68, TRUCK_H - 87, 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawFrame(ctx: Ctx, dir: TruckDir, col: number) {
  const phase = col / TRUCK_COLS;
  if (dir === 'down') drawFrontBack(ctx, phase, true);
  else if (dir === 'up') drawFrontBack(ctx, phase, false);
  else drawSide(ctx, phase, dir === 'right');

  const rng = makeRng(dir.length * 97 + 11);
  speckle(ctx, 10, 10, TRUCK_W - 20, TRUCK_H - 20, 40, ['rgba(193,68,14,0.1)'], rng, 1.4);
}

export function createTruckTextures(scene: Phaser.Scene) {
  const key = 'truck';
  if (scene.textures.exists(key)) return;
  const rows = TRUCK_DIRS.length;
  const texture = scene.textures.createCanvas(key, TRUCK_W * TRUCK_COLS, TRUCK_H * rows);
  if (!texture) return;
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, TRUCK_W * TRUCK_COLS, TRUCK_H * rows);

  const scratch = document.createElement('canvas');
  scratch.width = TRUCK_W;
  scratch.height = TRUCK_H;
  const sctx = scratch.getContext('2d') as Ctx;

  TRUCK_DIRS.forEach((dir, row) => {
    for (let col = 0; col < TRUCK_COLS; col++) {
      sctx.clearRect(0, 0, TRUCK_W, TRUCK_H);
      drawFrame(sctx, dir, col);
      ctx.drawImage(scratch, col * TRUCK_W, row * TRUCK_H);
    }
  });

  texture.add('__BASE', 0, 0, 0, TRUCK_W * TRUCK_COLS, TRUCK_H * rows);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < TRUCK_COLS; col++) {
      texture.add(row * TRUCK_COLS + col, 0, col * TRUCK_W, row * TRUCK_H, TRUCK_W, TRUCK_H);
    }
  }
  texture.refresh();
}

/** A parked, un-animated truck for the world — the same art, first frame. */
export function truckFrameFor(dir: TruckDir) {
  return TRUCK_DIRS.indexOf(dir) * TRUCK_COLS;
}
