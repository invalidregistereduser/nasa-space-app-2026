import type { CharacterId } from '../../types';
import { capsule, fillRoundRect, groundShadow, rGrad, roundRect, vGrad, type Ctx } from './draw';

export const FRAME_W = 64;
export const FRAME_H = 80;
export const COLS = 12;
/** Columns 8-11 hold the idle fidgets, drawn front-facing only. */
export const FIDGET_FRAMES = { stretchA: 8, stretchB: 9, sky: 10, wrist: 11 };
export const ROWS = 4;
/** Row order in the generated sheet. */
export const DIRS = ['down', 'left', 'right', 'up'] as const;
export type Dir = (typeof DIRS)[number];

interface Suit {
  /** Accent stripes down the legs — one of the two suit variants wears them. */
  legStripe: boolean;
  light: string;
  mid: string;
  shade: string;
  dark: string;
  joint: string;
  boot: string;
  bootLight: string;
  pack: string;
  packDark: string;
  accent: string;
  accentDim: string;
  trim: string;
  visorA: string;
  visorB: string;
}

const SUITS: Record<CharacterId, Suit> = {
  male: {
    legStripe: false,
    light: '#f6f8fb',
    mid: '#dde3ec',
    shade: '#b2bccb',
    dark: '#7b8899',
    joint: '#9aa6b6',
    boot: '#39404e',
    bootLight: '#596477',
    pack: '#c8cfda',
    packDark: '#6c7889',
    accent: '#e8701f',
    accentDim: '#a8450c',
    trim: '#38dcf8',
    visorA: '#0f2234',
    visorB: '#1d4e6b',
  },
  female: {
    legStripe: true,
    light: '#f7f6fb',
    mid: '#e0dced',
    shade: '#b6b0c9',
    dark: '#7d7793',
    joint: '#9d97b2',
    boot: '#3a3647',
    bootLight: '#5b5570',
    pack: '#ccc8db',
    packDark: '#6e687f',
    accent: '#9b7bff',
    accentDim: '#5f45c0',
    trim: '#5ae2d0',
    visorA: '#141b33',
    visorB: '#2d3f7a',
  },
};

/* ------------------------------------------------------------
   Shared pieces
   ------------------------------------------------------------ */
function drawBoot(ctx: Ctx, x: number, y: number, s: Suit, facing: 0 | 1 | -1) {
  const w = 12;
  const h = 7;
  const skew = facing * 2;
  fillRoundRect(ctx, x - w / 2 + skew, y - h / 2, w, h, 3, s.boot);
  ctx.fillStyle = s.bootLight;
  ctx.globalAlpha = 0.6;
  fillRoundRect(ctx, x - w / 2 + skew + 1, y - h / 2 + 0.6, w - 2, 2, 1.2, s.bootLight);
  ctx.globalAlpha = 1;
}

function drawBootSmall(ctx: Ctx, x: number, y: number, s: Suit) {
  fillRoundRect(ctx, x - 4.5, y - 3.4, 11, 6.6, 3, s.boot);
  ctx.fillStyle = s.bootLight;
  ctx.globalAlpha = 0.55;
  fillRoundRect(ctx, x - 3.5, y - 2.9, 9, 1.8, 1, s.bootLight);
  ctx.globalAlpha = 1;
}

function drawGlove(ctx: Ctx, x: number, y: number, s: Suit) {
  ctx.fillStyle = s.boot;
  ctx.beginPath();
  ctx.arc(x, y, 4.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = s.bootLight;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(x - 1, y - 1.3, 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function limbGradient(ctx: Ctx, s: Suit, y0: number, y1: number) {
  return vGrad(ctx, 0, y0, y1, [
    [0, s.light],
    [0.5, s.mid],
    [1, s.shade],
  ]);
}

function drawHelmetDome(ctx: Ctx, cx: number, cy: number, r: number, s: Suit) {
  // Outer shell with a light from the upper left.
  ctx.fillStyle = rGrad(
    ctx,
    cx,
    cy,
    r * 0.1,
    r,
    [
      [0, '#ffffff'],
      [0.45, s.light],
      [0.82, s.mid],
      [1, s.shade],
    ],
    cx - r * 0.38,
    cy - r * 0.42,
  );
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Rim light.
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 0.6, Math.PI * 1.05, Math.PI * 1.75);
  ctx.stroke();

  // Lower shadow edge.
  ctx.strokeStyle = 'rgba(80,92,110,0.5)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 0.7, Math.PI * 0.12, Math.PI * 0.78);
  ctx.stroke();
}

function drawVisor(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, s: Suit, side = 0) {
  ctx.save();
  ctx.translate(cx + side * 1.4, cy);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();

  const g = ctx.createLinearGradient(-rx, -ry, rx, ry);
  g.addColorStop(0, s.visorB);
  g.addColorStop(0.45, s.visorA);
  g.addColorStop(1, '#05080f');
  ctx.fillStyle = g;
  ctx.fillRect(-rx - 2, -ry - 2, rx * 2 + 4, ry * 2 + 4);

  // Reflected horizon + sun glint.
  ctx.fillStyle = 'rgba(214,126,70,0.28)';
  ctx.fillRect(-rx - 2, ry * 0.18, rx * 2 + 4, ry * 0.45);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(-rx * 0.38, -ry * 0.42, rx * 0.34, ry * 0.24, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(120,220,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(rx * 0.3, -ry * 0.1, rx * 0.18, ry * 0.42, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Visor frame.
  ctx.strokeStyle = 'rgba(150,164,182,0.9)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(cx + side * 1.4, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawAntenna(ctx: Ctx, x: number, y: number, s: Suit, dir: -1 | 1) {
  ctx.strokeStyle = s.dark;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dir * 1.8, y - 4.2);
  ctx.stroke();
  ctx.fillStyle = s.trim;
  ctx.beginPath();
  ctx.arc(x + dir * 1.8, y - 4.8, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawChestPanel(ctx: Ctx, cx: number, cy: number, s: Suit) {
  fillRoundRect(ctx, cx - 6.5, cy - 4.5, 13, 9.5, 2.5, '#2b323f');
  ctx.strokeStyle = 'rgba(190,205,225,0.5)';
  ctx.lineWidth = 0.8;
  roundRect(ctx, cx - 6.5, cy - 4.5, 13, 9.5, 2.5);
  ctx.stroke();
  const leds = [s.trim, '#76dc92', s.accent];
  leds.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(cx - 4.6 + i * 3.2, cy - 2.6, 1.9, 1.9);
  });
  ctx.fillStyle = 'rgba(190,205,225,0.45)';
  ctx.fillRect(cx - 4.6, cy + 0.9, 9, 1.1);
  ctx.fillRect(cx - 4.6, cy + 2.6, 5.5, 1);
}

/* ------------------------------------------------------------
   Front / back / side views
   ------------------------------------------------------------ */
type Pose = 'default' | 'stretchA' | 'stretchB' | 'sky' | 'wrist';

function drawFront(ctx: Ctx, s: Suit, swing: number, pose: Pose = 'default') {
  const hipY = 55;
  const footY = 71;
  const legSpread = 5.2;

  // Backpack peeking out behind the shoulders.
  fillRoundRect(ctx, 19, 31, 26, 17, 7, s.packDark);

  // Legs (back leg first).
  const order: (-1 | 1)[] = swing >= 0 ? [-1, 1] : [1, -1];
  order.forEach((sideSign) => {
    const forward = sideSign === 1 ? swing : -swing;
    const x = 32 + sideSign * legSpread;
    const grad = limbGradient(ctx, s, hipY, footY);
    const lift = Math.max(0, forward) * 2.4;
    capsule(ctx, x, hipY, x + forward * 2.2, footY - lift, 10, grad);
    if (s.legStripe) {
      capsule(ctx, x, hipY + 2, x + forward * 2.1, footY - lift - 2, 2.4, s.accent);
    }
    ctx.fillStyle = s.joint;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(x - 4.4 + forward * 0.6, hipY + 6, 9, 1.6);
    ctx.globalAlpha = 1;
    drawBoot(ctx, x + forward * 2.6, footY - lift + 2, s, 0);
  });

  // Torso.
  const torso = vGrad(ctx, 0, 31, 58, [
    [0, s.light],
    [0.42, s.mid],
    [1, s.shade],
  ]);
  fillRoundRect(ctx, 19.5, 31, 25, 27, 10, torso);
  // Right-side core shadow.
  ctx.save();
  roundRect(ctx, 19.5, 31, 25, 27, 10);
  ctx.clip();
  ctx.fillStyle = 'rgba(70,84,104,0.33)';
  ctx.fillRect(36, 31, 9, 27);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(20, 31, 5, 27);
  ctx.restore();

  // Shoulder accents + belt.
  ctx.fillStyle = s.accent;
  fillRoundRect(ctx, 19.5, 33.5, 6.5, 5.5, 2.4, s.accent);
  fillRoundRect(ctx, 38, 33.5, 6.5, 5.5, 2.4, s.accentDim);
  ctx.fillStyle = s.joint;
  ctx.fillRect(20.5, 50.5, 23, 2.6);
  ctx.fillStyle = s.accent;
  ctx.fillRect(28, 50.5, 8, 2.6);

  // Hoses.
  ctx.strokeStyle = s.packDark;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(22, 36);
  ctx.quadraticCurveTo(24, 42, 27, 43);
  ctx.moveTo(42, 36);
  ctx.quadraticCurveTo(40, 42, 37, 43);
  ctx.stroke();

  drawChestPanel(ctx, 32, 44, s);

  // Arms — the idle fidgets move them instead of swinging.
  const armGrad = limbGradient(ctx, s, 35, 58);
  const armSwing = -swing * 2.6;
  if (pose === 'stretchA' || pose === 'stretchB') {
    const reach = pose === 'stretchB' ? 10 : 4;
    capsule(ctx, 21.5, 36, 15.5, 20 - reach, 8, armGrad);
    capsule(ctx, 42.5, 36, 48.5, 20 - reach, 8, armGrad);
    drawGlove(ctx, 15, 18 - reach, s);
    drawGlove(ctx, 49, 18 - reach, s);
  } else if (pose === 'wrist') {
    // Right arm folded in, reading the wrist display.
    capsule(ctx, 21.5, 36, 18.5, 55, 8, armGrad);
    drawGlove(ctx, 18.5, 56.5, s);
    capsule(ctx, 42.5, 36, 36, 44, 8, armGrad);
    drawGlove(ctx, 35, 44, s);
    fillRoundRect(ctx, 31.5, 40.5, 9, 6.5, 2, '#1d2733');
    ctx.fillStyle = s.trim;
    ctx.fillRect(33, 42.5, 6, 1.4);
    ctx.fillStyle = '#76dc92';
    ctx.fillRect(33, 44.6, 3.4, 1.4);
  } else if (pose === 'sky') {
    capsule(ctx, 21.5, 36, 17.5, 52, 8, armGrad);
    capsule(ctx, 42.5, 36, 47.5, 26, 8, armGrad);
    drawGlove(ctx, 17.5, 53.5, s);
    drawGlove(ctx, 48, 24, s);
  } else {
    capsule(ctx, 21.5, 36, 18.5 - armSwing, 55, 8, armGrad);
    capsule(ctx, 42.5, 36, 45.5 + armSwing, 55, 8, armGrad);
    drawGlove(ctx, 18.5 - armSwing, 56.5, s);
    drawGlove(ctx, 45.5 + armSwing, 56.5, s);
  }

  // Neck ring.
  fillRoundRect(ctx, 26, 28.5, 12, 4.5, 2, s.joint);

  // Head lifts to the sky or dips to the wrist.
  const headY = pose === 'sky' ? 17.5 : pose === 'wrist' ? 21.5 : 20;
  const visorY = pose === 'sky' ? 17.2 : pose === 'wrist' ? 23 : 20.8;
  drawHelmetDome(ctx, 32, headY, 12.4, s);
  drawVisor(ctx, 32, visorY, 8.4, 7, s);
  drawAntenna(ctx, 42.5, headY - 4.5, s, 1);
}

function drawBack(ctx: Ctx, s: Suit, swing: number) {
  const hipY = 55;
  const footY = 71;
  const legSpread = 5.2;

  const order: (-1 | 1)[] = swing >= 0 ? [1, -1] : [-1, 1];
  order.forEach((sideSign) => {
    const forward = sideSign === 1 ? swing : -swing;
    const x = 32 + sideSign * legSpread;
    const grad = limbGradient(ctx, s, hipY, footY);
    const lift = Math.max(0, -forward) * 2.4;
    capsule(ctx, x, hipY, x - forward * 2.2, footY - lift, 10, grad);
    if (s.legStripe) {
      capsule(ctx, x, hipY + 2, x - forward * 2.1, footY - lift - 2, 2.4, s.accent);
    }
    drawBoot(ctx, x - forward * 2.6, footY - lift + 2, s, 0);
  });

  // Torso.
  const torso = vGrad(ctx, 0, 31, 58, [
    [0, s.light],
    [0.45, s.mid],
    [1, s.shade],
  ]);
  fillRoundRect(ctx, 19.5, 31, 25, 27, 10, torso);

  // Arms behind the pack.
  const armGrad = limbGradient(ctx, s, 35, 58);
  const armSwing = swing * 2.6;
  capsule(ctx, 21.5, 36, 18.5 - armSwing, 55, 8, armGrad);
  capsule(ctx, 42.5, 36, 45.5 + armSwing, 55, 8, armGrad);
  drawGlove(ctx, 18.5 - armSwing, 56.5, s);
  drawGlove(ctx, 45.5 + armSwing, 56.5, s);

  // Life-support backpack.
  const packGrad = vGrad(ctx, 0, 30, 54, [
    [0, '#ffffff'],
    [0.35, s.pack],
    [1, s.packDark],
  ]);
  fillRoundRect(ctx, 21, 30, 22, 25, 7, packGrad);
  ctx.strokeStyle = 'rgba(60,72,88,0.5)';
  ctx.lineWidth = 1;
  roundRect(ctx, 21, 30, 22, 25, 7);
  ctx.stroke();

  // Vents + mission patch + status light.
  ctx.fillStyle = 'rgba(80,92,110,0.75)';
  for (let i = 0; i < 3; i++) ctx.fillRect(24, 44 + i * 3.4, 16, 1.7);
  ctx.fillStyle = s.accent;
  ctx.beginPath();
  ctx.arc(32, 37, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(32, 37, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = s.trim;
  ctx.fillRect(39.5, 32.5, 2.2, 2.2);

  // Neck ring + helmet from behind.
  fillRoundRect(ctx, 26, 27.5, 12, 5, 2, s.joint);
  drawHelmetDome(ctx, 32, 20, 12.4, s);
  ctx.fillStyle = 'rgba(120,134,152,0.3)';
  ctx.beginPath();
  ctx.ellipse(32, 23, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  drawAntenna(ctx, 21.5, 15.5, s, -1);
}

function drawSide(ctx: Ctx, s: Suit, swing: number) {
  // Drawn facing right; the left-facing row is mirrored at blit time.
  const hipY = 55;
  const footY = 70;
  const shoulderY = 37;

  const farLimb = vGrad(ctx, 0, hipY - 18, footY, [
    [0, s.shade],
    [1, s.dark],
  ]);

  // --- Far arm and leg (solid darker tone, never translucent) ------------
  capsule(ctx, 30, shoulderY, 30 + swing * 5, 54, 7.5, farLimb);
  ctx.fillStyle = s.dark;
  ctx.beginPath();
  ctx.arc(30 + swing * 5.4, 55, 3.9, 0, Math.PI * 2);
  ctx.fill();

  capsule(ctx, 29.5, hipY, 29.5 - swing * 5, footY - 1.5 - Math.max(0, -swing) * 2, 9, farLimb);
  ctx.save();
  ctx.globalAlpha = 0.92;
  drawBootSmall(ctx, 29.5 - swing * 5.4, footY + 0.5 - Math.max(0, -swing) * 2, s);
  ctx.restore();

  // --- Life-support pack sitting behind the shoulders --------------------
  const packGrad = vGrad(ctx, 0, 31, 53, [
    [0, s.pack],
    [1, s.packDark],
  ]);
  fillRoundRect(ctx, 20, 32.5, 13, 20, 5.5, packGrad);
  ctx.strokeStyle = 'rgba(70,80,96,0.5)';
  ctx.lineWidth = 1;
  roundRect(ctx, 20, 32.5, 13, 20, 5.5);
  ctx.stroke();
  ctx.fillStyle = 'rgba(80,92,110,0.6)';
  ctx.fillRect(21.6, 43, 7, 1.5);
  ctx.fillRect(21.6, 46.2, 7, 1.5);
  ctx.fillStyle = s.trim;
  ctx.fillRect(21.6, 35, 2, 2);

  // Hose from the pack up to the helmet.
  ctx.strokeStyle = s.packDark;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(25.5, 33);
  ctx.quadraticCurveTo(26.5, 29, 30, 28.5);
  ctx.stroke();

  // --- Torso -------------------------------------------------------------
  const torso = vGrad(ctx, 0, 31, 58, [
    [0, s.light],
    [0.45, s.mid],
    [1, s.shade],
  ]);
  fillRoundRect(ctx, 26, 31, 19, 27, 8.5, torso);
  ctx.save();
  roundRect(ctx, 26, 31, 19, 27, 8.5);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.fillRect(26, 31, 5, 27);
  ctx.fillStyle = 'rgba(70,84,104,0.2)';
  ctx.fillRect(41, 31, 4, 27);
  ctx.restore();
  ctx.strokeStyle = 'rgba(96,110,130,0.4)';
  ctx.lineWidth = 1;
  roundRect(ctx, 26, 31, 19, 27, 8.5);
  ctx.stroke();

  // Chest accent + belt.
  ctx.fillStyle = s.accent;
  fillRoundRect(ctx, 34.5, 34, 8.5, 5, 2.2, s.accent);
  ctx.fillStyle = 'rgba(43,50,63,0.9)';
  fillRoundRect(ctx, 34.5, 41.5, 8.5, 6.5, 2, 'rgba(43,50,63,0.9)');
  ctx.fillStyle = s.trim;
  ctx.fillRect(36, 43.5, 1.8, 1.8);
  ctx.fillStyle = '#76dc92';
  ctx.fillRect(39, 43.5, 1.8, 1.8);
  ctx.fillStyle = s.joint;
  ctx.fillRect(26.5, 50.5, 18, 2.4);

  // --- Near leg ----------------------------------------------------------
  const nearGrad = limbGradient(ctx, s, hipY, footY);
  capsule(ctx, 35, hipY, 35 + swing * 5.4, footY - Math.max(0, swing) * 2, 10, nearGrad);
  drawBootSmall(ctx, 35 + swing * 5.8, footY + 2 - Math.max(0, swing) * 2, s);

  // --- Near arm ----------------------------------------------------------
  const armGrad = limbGradient(ctx, s, shoulderY, 56);
  capsule(ctx, 37, shoulderY, 37 - swing * 4.4, 53.5, 8, armGrad);
  drawGlove(ctx, 37 - swing * 4.8, 55, s);

  // --- Head --------------------------------------------------------------
  fillRoundRect(ctx, 29, 28, 12, 4.5, 2, s.joint);
  drawHelmetDome(ctx, 35, 20, 12, s);
  drawVisor(ctx, 38.4, 20.6, 6.2, 6.8, s, 0);
  drawAntenna(ctx, 26.5, 15.5, s, -1);
}

/* ------------------------------------------------------------
   Sheet builder
   ------------------------------------------------------------ */
const FIDGET_POSES: Pose[] = ['stretchA', 'stretchB', 'sky', 'wrist'];

function drawFrame(ctx: Ctx, dir: Dir, col: number, kind: CharacterId) {
  const s = SUITS[kind];
  const fidget = col >= 8;
  const walking = col >= 2 && col < 8;
  const walkFrame = col - 2;
  const phase = walking ? (walkFrame / 6) * Math.PI * 2 : (col / 2) * Math.PI;
  const swing = walking ? Math.sin(phase) : 0;
  const bob = walking ? Math.abs(Math.cos(phase)) * 1.7 : fidget ? 0 : Math.sin(phase) * 0.6;

  groundShadow(ctx, 32, 74.5, 14 - Math.abs(swing) * 1.5, 4.6, 0.38);

  ctx.save();
  ctx.translate(0, -bob);
  if (dir === 'down') drawFront(ctx, s, swing, fidget ? FIDGET_POSES[col - 8] : 'default');
  else if (dir === 'up') drawBack(ctx, s, swing);
  else drawSide(ctx, s, swing);
  ctx.restore();
}

/**
 * Builds the 8x4 sprite sheet for one astronaut and registers numbered frames.
 * Row order: down, left, right, up. Columns 0-1 idle, 2-7 walk cycle.
 */
export function buildAstronautSheet(scene: Phaser.Scene, key: string, kind: CharacterId) {
  if (scene.textures.exists(key)) return;
  const texture = scene.textures.createCanvas(key, FRAME_W * COLS, FRAME_H * ROWS);
  if (!texture) return;
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, FRAME_W * COLS, FRAME_H * ROWS);

  // Scratch canvas so the left-facing row can be mirrored cheaply.
  const scratch = document.createElement('canvas');
  scratch.width = FRAME_W;
  scratch.height = FRAME_H;
  const sctx = scratch.getContext('2d')!;

  DIRS.forEach((dir, row) => {
    for (let col = 0; col < COLS; col++) {
      sctx.clearRect(0, 0, FRAME_W, FRAME_H);
      sctx.save();
      drawFrame(sctx, dir, col, kind);
      sctx.restore();

      ctx.save();
      if (dir === 'left') {
        // Mirror the right-facing pose.
        ctx.translate(col * FRAME_W + FRAME_W, row * FRAME_H);
        ctx.scale(-1, 1);
        ctx.drawImage(scratch, 0, 0);
      } else {
        ctx.drawImage(scratch, col * FRAME_W, row * FRAME_H);
      }
      ctx.restore();
    }
  });

  texture.refresh();
  let index = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      texture.add(index, 0, col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H);
      index++;
    }
  }
}

/** Frame index helpers used by the animation setup. */
export function rowOf(dir: Dir) {
  return DIRS.indexOf(dir);
}

export function frameIndex(dir: Dir, col: number) {
  return rowOf(dir) * COLS + col;
}

/** Draws a single pose onto an arbitrary 2D context (used by the React menus). */
export function drawAstronautPose(
  ctx: Ctx,
  kind: CharacterId,
  dir: Dir,
  col: number,
  scale = 1,
) {
  ctx.save();
  ctx.scale(scale, scale);
  if (dir === 'left') {
    ctx.translate(FRAME_W, 0);
    ctx.scale(-1, 1);
    drawFrame(ctx, 'right', col, kind);
  } else {
    drawFrame(ctx, dir, col, kind);
  }
  ctx.restore();
}
