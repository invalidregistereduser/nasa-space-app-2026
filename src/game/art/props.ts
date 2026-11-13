import {
  canvasTex,
  fillRoundRect,
  groundShadow,
  makeRng,
  rGrad,
  roundRect,
  speckle,
  vGrad,
  type Ctx,
} from './draw';

const METAL_LIGHT = '#eef2f7';
const METAL_MID = '#c3ccd8';
const METAL_SHADE = '#8d99a8';
const METAL_DARK = '#4d5766';
const METAL_DEEP = '#272e38';

function base(ctx: Ctx, w: number, h: number, rx = w * 0.34, ry = h * 0.1) {
  groundShadow(ctx, w * 0.5, h * 0.86, rx, ry, 0.42);
}

function metalGrad(ctx: Ctx, y0: number, y1: number) {
  return vGrad(ctx, 0, y0, y1, [
    [0, METAL_LIGHT],
    [0.42, METAL_MID],
    [1, METAL_DARK],
  ]);
}

function dusting(ctx: Ctx, x: number, y: number, w: number, h: number, seed: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = vGrad(ctx, 0, y + h * 0.4, y + h, [
    [0, 'rgba(170,96,46,0)'],
    [1, 'rgba(150,80,36,0.45)'],
  ]);
  ctx.fillRect(x, y, w, h);
  speckle(ctx, x, y, w, h, 60, ['rgba(130,70,30,0.25)'], makeRng(seed), 2);
  ctx.restore();
}

/* ============================================================
   Collectables
   ============================================================ */
function drawSupplyBox(ctx: Ctx, w: number, h: number) {
  base(ctx, w, h);
  const bw = w * 0.66;
  const bh = h * 0.44;
  const x = (w - bw) / 2;
  const y = h * 0.42;

  fillRoundRect(ctx, x, y, bw, bh, 6, vGrad(ctx, 0, y, y + bh, [
    [0, '#f08a3c'],
    [0.45, '#d4661f'],
    [1, '#8e3d0e'],
  ]));
  ctx.strokeStyle = 'rgba(60,28,10,0.6)';
  ctx.lineWidth = 1.6;
  roundRect(ctx, x, y, bw, bh, 6);
  ctx.stroke();

  // Lid, slightly ajar.
  ctx.save();
  ctx.translate(x + bw * 0.5, y);
  ctx.rotate(-0.16);
  fillRoundRect(ctx, -bw * 0.52, -bh * 0.3, bw * 1.04, bh * 0.3, 5, vGrad(ctx, 0, -bh * 0.3, 0, [
    [0, '#ffffff'],
    [1, '#c8cfda'],
  ]));
  ctx.strokeStyle = 'rgba(60,70,86,0.5)';
  ctx.lineWidth = 1.4;
  roundRect(ctx, -bw * 0.52, -bh * 0.3, bw * 1.04, bh * 0.3, 5);
  ctx.stroke();
  ctx.fillStyle = '#c1440e';
  ctx.fillRect(-bw * 0.44, -bh * 0.22, bw * 0.88, 4);
  ctx.restore();

  // Reflective stripes + latches.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(x + 4, y + bh * 0.42, bw - 8, 5);
  ctx.fillStyle = 'rgba(56,220,248,0.75)';
  ctx.fillRect(x + 4, y + bh * 0.62, bw - 8, 3);
  ctx.fillStyle = METAL_SHADE;
  [0.22, 0.78].forEach((t) => {
    fillRoundRect(ctx, x + bw * t - 4, y + bh * 0.3, 8, 10, 2, METAL_SHADE);
  });
  ctx.fillStyle = '#1b2430';
  ctx.font = 'bold 9px "Courier New", monospace';
  ctx.fillText('O2 / MED', x + bw * 0.18, y + bh * 0.88);
  dusting(ctx, 0, 0, w, h, 5);
}

function drawSeedVault(ctx: Ctx, w: number, h: number) {
  base(ctx, w, h, w * 0.26);
  const cx = w * 0.5;
  const bw = w * 0.42;
  const bh = h * 0.52;
  const y = h * 0.34;

  fillRoundRect(ctx, cx - bw / 2, y, bw, bh, 10, metalGrad(ctx, y, y + bh));
  ctx.strokeStyle = 'rgba(50,60,74,0.6)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, cx - bw / 2, y, bw, bh, 10);
  ctx.stroke();

  // Frosted window with seed trays.
  fillRoundRect(ctx, cx - bw * 0.32, y + bh * 0.16, bw * 0.64, bh * 0.5, 5, '#0d2330');
  ctx.fillStyle = rGrad(ctx, cx, y + bh * 0.4, 2, bw * 0.5, [
    [0, 'rgba(118,220,146,0.55)'],
    [1, 'rgba(20,60,50,0.2)'],
  ]);
  fillRoundRect(ctx, cx - bw * 0.3, y + bh * 0.18, bw * 0.6, bh * 0.46, 4, ctx.fillStyle);
  ctx.fillStyle = 'rgba(200,255,220,0.8)';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(cx - bw * 0.24, y + bh * 0.24 + i * bh * 0.12, bw * 0.48, 2);
  }
  ctx.strokeStyle = 'rgba(190,230,255,0.6)';
  ctx.lineWidth = 1.4;
  roundRect(ctx, cx - bw * 0.32, y + bh * 0.16, bw * 0.64, bh * 0.5, 5);
  ctx.stroke();

  // Cryo fins + status.
  ctx.fillStyle = METAL_SHADE;
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(cx - bw / 2 - 5, y + bh * 0.2 + i * 12, 5, 7);
    ctx.fillRect(cx + bw / 2, y + bh * 0.2 + i * 12, 5, 7);
  }
  ctx.fillStyle = '#38dcf8';
  ctx.beginPath();
  ctx.arc(cx, y + bh * 0.82, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b2430';
  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.fillText('SEED-01', cx - bw * 0.26, y + bh * 0.95);
  dusting(ctx, 0, 0, w, h, 9);
}

function drawPlanters(ctx: Ctx, w: number, h: number) {
  base(ctx, w, h, w * 0.36);
  for (let i = 2; i >= 0; i--) {
    const y = h * 0.74 - i * h * 0.15;
    const tw = w * 0.62;
    fillRoundRect(ctx, (w - tw) / 2, y - h * 0.12, tw, h * 0.14, 4, metalGrad(ctx, y - h * 0.12, y + 2));
    ctx.strokeStyle = 'rgba(50,60,74,0.55)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, (w - tw) / 2, y - h * 0.12, tw, h * 0.14, 4);
    ctx.stroke();
    // Growth medium in the top tray.
    if (i === 2) {
      ctx.fillStyle = '#5b3a24';
      fillRoundRect(ctx, (w - tw) / 2 + 4, y - h * 0.1, tw - 8, h * 0.06, 2, '#5b3a24');
      speckle(ctx, (w - tw) / 2 + 4, y - h * 0.1, tw - 8, h * 0.06, 50, ['rgba(0,0,0,0.3)', 'rgba(180,120,80,0.4)'], makeRng(31), 1.6);
    }
    ctx.fillStyle = 'rgba(56,220,248,0.5)';
    ctx.fillRect((w - tw) / 2 + 6, y - h * 0.03, tw * 0.3, 2);
  }
  dusting(ctx, 0, 0, w, h, 13);
}

function drawPanels(ctx: Ctx, w: number, h: number) {
  base(ctx, w, h, w * 0.34);
  ctx.save();
  ctx.translate(w * 0.5, h * 0.6);
  ctx.rotate(-0.12);
  for (let i = 0; i < 3; i++) {
    const off = i * 7;
    ctx.save();
    ctx.translate(-off * 0.5, -off);
    const pw = w * 0.56;
    const ph = h * 0.36;
    ctx.fillStyle = 'rgba(176,214,235,0.4)';
    fillRoundRect(ctx, -pw / 2, -ph / 2, pw, ph, 4, 'rgba(176,214,235,0.4)');
    ctx.strokeStyle = 'rgba(220,240,255,0.85)';
    ctx.lineWidth = 2;
    roundRect(ctx, -pw / 2, -ph / 2, pw, ph, 4);
    ctx.stroke();
    // Sheen.
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.moveTo(-pw / 2 + 4, ph / 2 - 3);
    ctx.lineTo(-pw / 2 + pw * 0.4, -ph / 2 + 3);
    ctx.lineTo(-pw / 2 + pw * 0.55, -ph / 2 + 3);
    ctx.lineTo(-pw / 2 + pw * 0.2, ph / 2 - 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  // Carry frame.
  ctx.strokeStyle = METAL_SHADE;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w * 0.2, h * 0.78);
  ctx.lineTo(w * 0.8, h * 0.72);
  ctx.stroke();
  dusting(ctx, 0, 0, w, h, 17);
}

function drawFrame(ctx: Ctx, w: number, h: number) {
  base(ctx, w, h, w * 0.4);
  ctx.save();
  ctx.translate(w * 0.5, h * 0.62);
  ctx.rotate(-0.1);
  for (let i = 0; i < 5; i++) {
    const y = -14 + i * 7;
    const len = w * (0.72 - Math.abs(i - 2) * 0.04);
    ctx.fillStyle = i % 2 ? METAL_MID : METAL_SHADE;
    fillRoundRect(ctx, -len / 2, y, len, 6, 3, ctx.fillStyle);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(-len / 2 + 2, y + 1, len - 4, 1.4);
  }
  // Binding straps.
  ctx.fillStyle = '#c1440e';
  ctx.fillRect(-w * 0.2, -16, 7, 38);
  ctx.fillRect(w * 0.14, -16, 7, 38);
  ctx.restore();
  dusting(ctx, 0, 0, w, h, 23);
}

function drawWaterUnit(ctx: Ctx, w: number, h: number) {
  base(ctx, w, h, w * 0.3);
  const cx = w * 0.5;
  const bw = w * 0.44;
  const bh = h * 0.5;
  const y = h * 0.34;

  // Tank.
  fillRoundRect(ctx, cx - bw / 2, y, bw, bh, 14, metalGrad(ctx, y, y + bh));
  ctx.strokeStyle = 'rgba(50,60,74,0.6)';
  ctx.lineWidth = 1.6;
  roundRect(ctx, cx - bw / 2, y, bw, bh, 14);
  ctx.stroke();
  // Level window.
  fillRoundRect(ctx, cx - bw * 0.14, y + bh * 0.18, bw * 0.28, bh * 0.62, 4, '#0b2430');
  ctx.fillStyle = vGrad(ctx, 0, y + bh * 0.45, y + bh * 0.8, [
    [0, 'rgba(90,200,255,0.9)'],
    [1, 'rgba(20,110,160,0.9)'],
  ]);
  fillRoundRect(ctx, cx - bw * 0.11, y + bh * 0.45, bw * 0.22, bh * 0.33, 2, ctx.fillStyle);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(cx - bw * 0.09, y + bh * 0.47, 2.5, bh * 0.28);

  // Pipes.
  ctx.strokeStyle = METAL_SHADE;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - bw / 2 + 4, y + bh * 0.3);
  ctx.lineTo(cx - bw * 0.78, y + bh * 0.3);
  ctx.lineTo(cx - bw * 0.78, y + bh * 0.9);
  ctx.moveTo(cx + bw / 2 - 4, y + bh * 0.5);
  ctx.lineTo(cx + bw * 0.74, y + bh * 0.5);
  ctx.stroke();
  ctx.fillStyle = '#38dcf8';
  ctx.beginPath();
  ctx.arc(cx + bw * 0.76, y + bh * 0.5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b2430';
  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.fillText('H2O-REC', cx - bw * 0.3, y + bh * 0.12);
  dusting(ctx, 0, 0, w, h, 29);
}

function drawSolar(ctx: Ctx, w: number, h: number) {
  base(ctx, w, h, w * 0.4, h * 0.07);
  ctx.save();
  ctx.translate(w * 0.5, h * 0.6);
  ctx.rotate(-0.22);
  const pw = w * 0.78;
  const ph = h * 0.4;
  ctx.fillStyle = '#16294a';
  fillRoundRect(ctx, -pw / 2, -ph / 2, pw, ph, 4, '#16294a');
  ctx.strokeStyle = METAL_SHADE;
  ctx.lineWidth = 2;
  roundRect(ctx, -pw / 2, -ph / 2, pw, ph, 4);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,180,255,0.5)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(-pw / 2 + (pw / 7) * i, -ph / 2);
    ctx.lineTo(-pw / 2 + (pw / 7) * i, ph / 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-pw / 2, 0);
  ctx.lineTo(pw / 2, 0);
  ctx.stroke();
  // Specular sweep.
  ctx.fillStyle = 'rgba(190,225,255,0.3)';
  ctx.beginPath();
  ctx.moveTo(-pw / 2, -ph / 2);
  ctx.lineTo(-pw / 2 + pw * 0.34, -ph / 2);
  ctx.lineTo(-pw / 2 + pw * 0.14, ph / 2);
  ctx.lineTo(-pw / 2, ph / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Folding hinge.
  ctx.fillStyle = METAL_SHADE;
  fillRoundRect(ctx, w * 0.42, h * 0.68, w * 0.16, 9, 4, METAL_SHADE);
  dusting(ctx, 0, 0, w, h, 37);
}

function drawPowerCell(ctx: Ctx, w: number, h: number) {
  base(ctx, w, h, w * 0.28);
  const bw = w * 0.46;
  const bh = h * 0.4;
  const x = (w - bw) / 2;
  const y = h * 0.46;
  fillRoundRect(ctx, x, y, bw, bh, 7, vGrad(ctx, 0, y, y + bh, [
    [0, '#3c4654'],
    [0.5, '#262e3a'],
    [1, '#141a22'],
  ]));
  ctx.strokeStyle = 'rgba(120,134,152,0.6)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, bw, bh, 7);
  ctx.stroke();
  // Charge LEDs.
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i < 3 ? '#76dc92' : 'rgba(120,134,152,0.4)';
    fillRoundRect(ctx, x + 6, y + 7 + i * (bh * 0.2), bw - 12, 4, 2, ctx.fillStyle);
  }
  // Terminals.
  ctx.fillStyle = METAL_MID;
  fillRoundRect(ctx, x + bw * 0.14, y - 7, 10, 8, 2, METAL_MID);
  fillRoundRect(ctx, x + bw * 0.66, y - 7, 10, 8, 2, METAL_MID);
  ctx.fillStyle = '#f5a524';
  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.fillText('PWR', x + bw * 0.3, y + bh - 5);
  dusting(ctx, 0, 0, w, h, 41);
}

function drawAntennaDish(ctx: Ctx, w: number, h: number) {
  base(ctx, w, h, w * 0.36);
  ctx.save();
  ctx.translate(w * 0.5, h * 0.58);
  ctx.rotate(0.25);
  // Dish.
  ctx.fillStyle = rGrad(ctx, 0, 0, 3, w * 0.38, [
    [0, '#ffffff'],
    [0.45, METAL_MID],
    [1, METAL_SHADE],
  ]);
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.36, h * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = METAL_DARK;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  // Inner dish shading + a dent.
  ctx.fillStyle = 'rgba(80,96,116,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 2, w * 0.28, h * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(40,50,64,0.4)';
  ctx.beginPath();
  ctx.ellipse(-w * 0.14, h * 0.05, w * 0.1, h * 0.05, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Feed horn.
  ctx.strokeStyle = METAL_SHADE;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w * 0.1, -h * 0.16);
  ctx.stroke();
  ctx.fillStyle = '#38dcf8';
  ctx.beginPath();
  ctx.arc(w * 0.1, -h * 0.17, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  dusting(ctx, 0, 0, w, h, 43);
}

function drawCanister(ctx: Ctx, w: number, h: number) {
  base(ctx, w, h, w * 0.22);
  const cx = w * 0.5;
  const bw = w * 0.3;
  const bh = h * 0.5;
  const y = h * 0.34;
  fillRoundRect(ctx, cx - bw / 2, y, bw, bh, bw / 2, vGrad(ctx, 0, y, y + bh, [
    [0, '#f4f8fc'],
    [0.5, '#d4dde7'],
    [1, '#8c99a8'],
  ]));
  ctx.strokeStyle = 'rgba(60,72,88,0.5)';
  ctx.lineWidth = 1.4;
  roundRect(ctx, cx - bw / 2, y, bw, bh, bw / 2);
  ctx.stroke();
  ctx.fillStyle = '#76dc92';
  ctx.fillRect(cx - bw / 2 + 2, y + bh * 0.34, bw - 4, 6);
  ctx.fillStyle = '#1b2430';
  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.fillText('O₂', cx - 7, y + bh * 0.72);
  // Valve.
  ctx.fillStyle = METAL_SHADE;
  fillRoundRect(ctx, cx - 5, y - 9, 10, 10, 3, METAL_SHADE);
  ctx.fillStyle = METAL_DARK;
  ctx.beginPath();
  ctx.arc(cx, y - 10, 4, 0, Math.PI * 2);
  ctx.fill();
  dusting(ctx, 0, 0, w, h, 47);
}

function drawCargoPod(ctx: Ctx, w: number, h: number) {
  base(ctx, w, h, w * 0.4);
  ctx.save();
  ctx.translate(w * 0.5, h * 0.64);
  ctx.rotate(0.3);
  // Half-buried cone.
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, h * 0.14);
  ctx.quadraticCurveTo(-w * 0.34, -h * 0.1, 0, -h * 0.24);
  ctx.quadraticCurveTo(w * 0.34, -h * 0.1, w * 0.3, h * 0.14);
  ctx.closePath();
  ctx.fillStyle = vGrad(ctx, 0, -h * 0.24, h * 0.14, [
    [0, METAL_LIGHT],
    [0.5, METAL_MID],
    [1, METAL_DARK],
  ]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(50,60,74,0.6)';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  // Hatch.
  ctx.fillStyle = METAL_DEEP;
  fillRoundRect(ctx, -w * 0.12, -h * 0.12, w * 0.24, h * 0.18, 6, METAL_DEEP);
  ctx.fillStyle = 'rgba(245,165,36,0.8)';
  fillRoundRect(ctx, -w * 0.09, -h * 0.09, w * 0.18, h * 0.04, 2, 'rgba(245,165,36,0.8)');
  ctx.fillStyle = '#c1440e';
  ctx.fillRect(-w * 0.3, h * 0.02, w * 0.6, 5);
  ctx.restore();
  dusting(ctx, 0, 0, w, h, 53);
}

/* ============================================================
   Debris, markers and site pads
   ============================================================ */
function drawDebris(ctx: Ctx, w: number, h: number, seed: number) {
  const rng = makeRng(seed);
  groundShadow(ctx, w * 0.5, h * 0.66, w * 0.3, h * 0.12, 0.32);
  ctx.save();
  ctx.translate(w * 0.5, h * 0.55);
  ctx.rotate((rng() - 0.5) * 2);
  const pw = w * (0.4 + rng() * 0.3);
  const ph = h * (0.16 + rng() * 0.14);
  ctx.beginPath();
  ctx.moveTo(-pw / 2, -ph / 2);
  ctx.lineTo(pw * 0.34, -ph * 0.7);
  ctx.lineTo(pw / 2, ph * 0.4);
  ctx.lineTo(-pw * 0.2, ph / 2);
  ctx.closePath();
  ctx.fillStyle = vGrad(ctx, 0, -ph, ph, [
    [0, METAL_MID],
    [1, METAL_DARK],
  ]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,190,0.4)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  if (rng() > 0.5) {
    ctx.fillStyle = '#c1440e';
    ctx.fillRect(-pw * 0.3, -ph * 0.1, pw * 0.5, 3);
  }
  ctx.restore();
  dusting(ctx, 0, 0, w, h, seed);
}

function drawMarkerRing(ctx: Ctx, w: number, h: number, color: string) {
  const cx = w / 2;
  const cy = h / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.38, h * 0.2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 8;
  ctx.stroke();
  // Tick marks.
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = cx + Math.cos(a) * w * 0.38;
    const y = cy + Math.sin(a) * h * 0.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(cx + Math.cos(a) * w * 0.44, cy + Math.sin(a) * h * 0.26);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSitePad(ctx: Ctx, w: number, h: number, color: string) {
  const cx = w / 2;
  const cy = h / 2;
  ctx.save();
  // Holographic floor.
  ctx.fillStyle = rGrad(ctx, cx, cy, 0, w * 0.46, [
    [0, color.replace('ALPHA', '0.22')],
    [0.7, color.replace('ALPHA', '0.08')],
    [1, color.replace('ALPHA', '0')],
  ]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.46, h * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color.replace('ALPHA', '0.85');
  ctx.lineWidth = 2.5;
  ctx.setLineDash([12, 9]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.42, h * 0.24, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Corner brackets.
  ctx.lineWidth = 3;
  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];
  corners.forEach(([sx, sy]) => {
    const x = cx + sx * w * 0.36;
    const y = cy + sy * h * 0.19;
    ctx.beginPath();
    ctx.moveTo(x - sx * 16, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y - sy * 10);
    ctx.stroke();
  });

  // Grid.
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * w * 0.11, cy - h * 0.2);
    ctx.lineTo(cx + i * w * 0.11, cy + h * 0.2);
    ctx.stroke();
  }
  ctx.restore();
}

export function createPropTextures(scene: Phaser.Scene) {
  const S = 96;
  canvasTex(scene, 'prop_supplybox', S, S, drawSupplyBox);
  canvasTex(scene, 'prop_seedvault', S, S, drawSeedVault);
  canvasTex(scene, 'prop_planters', S, S, drawPlanters);
  canvasTex(scene, 'prop_panels', S, S, drawPanels);
  canvasTex(scene, 'prop_frame', S, S, drawFrame);
  canvasTex(scene, 'prop_waterunit', S, S, drawWaterUnit);
  canvasTex(scene, 'prop_solar', S, S, drawSolar);
  canvasTex(scene, 'prop_powercell', S, S, drawPowerCell);
  canvasTex(scene, 'prop_antenna', S, S, drawAntennaDish);
  canvasTex(scene, 'prop_canister', S, S, drawCanister);
  canvasTex(scene, 'prop_cargopod', S, S, drawCargoPod);

  for (let i = 0; i < 3; i++) {
    canvasTex(scene, `debris_${i}`, 64, 48, (ctx, w, h) => drawDebris(ctx, w, h, 300 + i * 29));
  }

  canvasTex(scene, 'marker_ring', 160, 90, (ctx, w, h) => drawMarkerRing(ctx, w, h, '#38dcf8'));
  canvasTex(scene, 'marker_ring_green', 160, 90, (ctx, w, h) => drawMarkerRing(ctx, w, h, '#76dc92'));
  canvasTex(scene, 'site_pad', 220, 140, (ctx, w, h) =>
    drawSitePad(ctx, w, h, 'rgba(56,220,248,ALPHA)'),
  );
  canvasTex(scene, 'site_pad_active', 220, 140, (ctx, w, h) =>
    drawSitePad(ctx, w, h, 'rgba(118,220,146,ALPHA)'),
  );
}
