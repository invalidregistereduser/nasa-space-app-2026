import {
  canvasTex,
  fillRoundRect,
  groundShadow,
  hGrad,
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
const METAL_DEEP = '#2b323d';

function panelLines(ctx: Ctx, x: number, y: number, w: number, h: number, rows: number, cols: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(60,72,88,0.35)';
  ctx.lineWidth = 1;
  for (let i = 1; i < rows; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + (h / rows) * i);
    ctx.lineTo(x + w, y + (h / rows) * i);
    ctx.stroke();
  }
  for (let i = 1; i < cols; i++) {
    ctx.beginPath();
    ctx.moveTo(x + (w / cols) * i, y);
    ctx.lineTo(x + (w / cols) * i, y + h);
    ctx.stroke();
  }
  ctx.restore();
}

function rivets(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, count: number) {
  ctx.save();
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(40,48,60,0.5)';
    ctx.beginPath();
    ctx.arc(x + 0.4, y + 0.6, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Dust and rust accumulating on the lower third of a structure. */
function weather(ctx: Ctx, x: number, y: number, w: number, h: number, seed: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = vGrad(ctx, 0, y + h * 0.35, y + h, [
    [0, 'rgba(168,92,44,0)'],
    [1, 'rgba(142,70,30,0.55)'],
  ]);
  ctx.fillRect(x, y, w, h);
  speckle(ctx, x, y, w, h, 180, ['rgba(120,60,26,0.3)', 'rgba(60,30,14,0.25)'], makeRng(seed), 3);
  ctx.restore();
}

/* ============================================================
   Crashed descent module
   ============================================================ */
function drawShip(ctx: Ctx, w: number, h: number) {
  const rng = makeRng(2024);
  groundShadow(ctx, w * 0.5, h * 0.84, w * 0.42, h * 0.1, 0.5);

  ctx.save();
  ctx.translate(w * 0.5, h * 0.55);
  ctx.rotate(-0.16);

  // --- Main hull ---------------------------------------------------------
  const hw = w * 0.34;
  const hh = h * 0.28;
  ctx.beginPath();
  ctx.moveTo(-hw, -hh * 0.55);
  ctx.quadraticCurveTo(-hw * 1.08, 0, -hw * 0.86, hh * 0.72);
  ctx.lineTo(hw * 0.72, hh);
  ctx.quadraticCurveTo(hw * 1.12, hh * 0.3, hw * 0.96, -hh * 0.5);
  ctx.quadraticCurveTo(hw * 0.3, -hh * 1.12, -hw, -hh * 0.55);
  ctx.closePath();

  ctx.fillStyle = vGrad(ctx, 0, -hh, hh, [
    [0, METAL_LIGHT],
    [0.3, METAL_MID],
    [0.68, METAL_SHADE],
    [1, METAL_DARK],
  ]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,48,60,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.save();
  ctx.clip();
  panelLines(ctx, -hw, -hh, hw * 2, hh * 2, 4, 6);

  // Mission livery.
  ctx.fillStyle = '#c1440e';
  ctx.fillRect(-hw * 0.9, -hh * 0.1, hw * 1.8, 9);
  ctx.fillStyle = 'rgba(56,220,248,0.75)';
  ctx.fillRect(-hw * 0.9, hh * 0.1, hw * 1.8, 3);
  ctx.fillStyle = '#1b2430';
  ctx.font = 'bold 15px "Courier New", monospace';
  ctx.fillText('ARES HORIZON-7', -hw * 0.72, -hh * 0.3);
  ctx.fillStyle = 'rgba(27,36,48,0.6)';
  ctx.font = 'bold 9px "Courier New", monospace';
  ctx.fillText('NASA // ARES PROGRAM', -hw * 0.72, hh * 0.42);

  // Viewport.
  ctx.fillStyle = METAL_DEEP;
  ctx.beginPath();
  ctx.ellipse(hw * 0.42, -hh * 0.18, 22, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rGrad(ctx, hw * 0.42, -hh * 0.18, 2, 20, [
    [0, 'rgba(120,200,255,0.8)'],
    [0.6, 'rgba(40,90,140,0.5)'],
    [1, 'rgba(10,20,34,0.9)'],
  ]);
  ctx.beginPath();
  ctx.ellipse(hw * 0.42, -hh * 0.18, 18, 13.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Open hatch with warm interior light.
  ctx.fillStyle = METAL_DEEP;
  fillRoundRect(ctx, -hw * 0.52, -hh * 0.42, 46, 60, 8, METAL_DEEP);
  ctx.fillStyle = rGrad(ctx, -hw * 0.52 + 23, -hh * 0.42 + 30, 2, 36, [
    [0, 'rgba(255,196,120,0.9)'],
    [0.5, 'rgba(190,96,40,0.5)'],
    [1, 'rgba(30,14,8,0.95)'],
  ]);
  fillRoundRect(ctx, -hw * 0.52 + 4, -hh * 0.42 + 4, 38, 52, 6, ctx.fillStyle);

  // Torn hull on the right where the module split.
  ctx.fillStyle = METAL_DEEP;
  ctx.beginPath();
  ctx.moveTo(hw * 0.78, -hh * 0.6);
  for (let i = 0; i < 9; i++) {
    ctx.lineTo(hw * (0.78 + (i % 2 ? 0.12 : 0.02)), -hh * 0.6 + i * (hh * 0.2));
  }
  ctx.lineTo(hw * 0.78, hh);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,170,110,0.55)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  weather(ctx, -hw * 1.2, -hh * 1.2, hw * 2.4, hh * 2.4, 11);
  ctx.restore();

  rivets(ctx, -hw * 0.92, -hh * 0.42, hw * 0.88, -hh * 0.62, 11);
  rivets(ctx, -hw * 0.8, hh * 0.78, hw * 0.7, hh * 0.92, 10);

  // --- Nose cone ---------------------------------------------------------
  ctx.beginPath();
  ctx.moveTo(-hw, -hh * 0.55);
  ctx.quadraticCurveTo(-hw * 1.52, -hh * 0.1, -hw * 1.3, hh * 0.5);
  ctx.quadraticCurveTo(-hw * 1.1, hh * 0.68, -hw * 0.86, hh * 0.72);
  ctx.closePath();
  ctx.fillStyle = hGrad(ctx, -hw * 1.5, -hw * 0.8, [
    [0, '#6b7585'],
    [0.6, METAL_SHADE],
    [1, METAL_MID],
  ]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,36,46,0.7)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.restore();

  // --- Broken landing strut ----------------------------------------------
  ctx.save();
  ctx.strokeStyle = METAL_SHADE;
  ctx.lineCap = 'round';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(w * 0.33, h * 0.62);
  ctx.lineTo(w * 0.2, h * 0.84);
  ctx.stroke();
  ctx.strokeStyle = METAL_DARK;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = METAL_SHADE;
  ctx.beginPath();
  ctx.ellipse(w * 0.19, h * 0.85, 26, 10, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(w * 0.19, h * 0.835, 20, 5, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Second strut, snapped and lying on the ground.
  ctx.strokeStyle = METAL_SHADE;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(w * 0.72, h * 0.78);
  ctx.lineTo(w * 0.9, h * 0.86);
  ctx.stroke();
  ctx.restore();

  // --- Debris around the base --------------------------------------------
  for (let i = 0; i < 12; i++) {
    const x = w * (0.1 + rng() * 0.82);
    const y = h * (0.74 + rng() * 0.2);
    const s = 6 + rng() * 16;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rng() * Math.PI);
    ctx.fillStyle = 'rgba(30,18,12,0.35)';
    ctx.fillRect(-s / 2 + 2, -s / 5 + 2, s, s * 0.4);
    ctx.fillStyle = rng() > 0.4 ? METAL_SHADE : '#8a5434';
    ctx.fillRect(-s / 2, -s / 5, s, s * 0.4);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-s / 2, -s / 5, s, 1.4);
    ctx.restore();
  }
}

/* ============================================================
   Emergency shelter / habitat
   ============================================================ */
function drawShelter(ctx: Ctx, w: number, h: number) {
  groundShadow(ctx, w * 0.5, h * 0.88, w * 0.4, h * 0.09, 0.45);

  const cx = w * 0.5;
  const baseY = h * 0.84;
  const r = w * 0.33;

  // Dome.
  ctx.beginPath();
  ctx.moveTo(cx - r, baseY);
  ctx.arc(cx, baseY, r, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = rGrad(
    ctx,
    cx,
    baseY,
    r * 0.1,
    r * 1.2,
    [
      [0, '#ffffff'],
      [0.4, METAL_LIGHT],
      [0.75, METAL_MID],
      [1, METAL_SHADE],
    ],
    cx - r * 0.42,
    baseY - r * 0.75,
  );
  ctx.fill();

  // Inflatable ribs.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - r, baseY);
  ctx.arc(cx, baseY, r, Math.PI, 0);
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = 'rgba(120,134,152,0.45)';
  ctx.lineWidth = 2;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, baseY, Math.abs(i) * (r / 3.4) + 2, r, 0, Math.PI, 0);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(120,134,152,0.35)';
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, baseY, r, (r / 4) * i, 0, Math.PI, 0);
    ctx.stroke();
  }
  // Warm interior glow through the upper window.
  ctx.fillStyle = rGrad(ctx, cx + r * 0.42, baseY - r * 0.52, 2, 34, [
    [0, 'rgba(120,220,255,0.85)'],
    [0.5, 'rgba(40,140,190,0.45)'],
    [1, 'rgba(20,40,60,0)'],
  ]);
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.42, baseY - r * 0.52, 26, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,220,240,0.8)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.42, baseY - r * 0.52, 19, 14, 0, 0, Math.PI * 2);
  ctx.stroke();

  weather(ctx, cx - r, baseY - r, r * 2, r, 44);
  ctx.restore();

  // Airlock cylinder at the front.
  const alw = w * 0.2;
  const alh = h * 0.3;
  fillRoundRect(
    ctx,
    cx - alw / 2,
    baseY - alh * 0.72,
    alw,
    alh,
    12,
    vGrad(ctx, 0, baseY - alh * 0.72, baseY + alh * 0.3, [
      [0, METAL_LIGHT],
      [0.5, METAL_MID],
      [1, METAL_DARK],
    ]),
  );
  ctx.strokeStyle = 'rgba(50,60,74,0.6)';
  ctx.lineWidth = 1.6;
  roundRect(ctx, cx - alw / 2, baseY - alh * 0.72, alw, alh, 12);
  ctx.stroke();

  // Airlock door with a cyan status ring.
  ctx.fillStyle = METAL_DEEP;
  fillRoundRect(ctx, cx - alw * 0.3, baseY - alh * 0.52, alw * 0.6, alh * 0.68, 8, METAL_DEEP);
  ctx.strokeStyle = 'rgba(56,220,248,0.9)';
  ctx.lineWidth = 2.4;
  roundRect(ctx, cx - alw * 0.3, baseY - alh * 0.52, alw * 0.6, alh * 0.68, 8);
  ctx.stroke();
  ctx.fillStyle = 'rgba(56,220,248,0.22)';
  fillRoundRect(ctx, cx - alw * 0.24, baseY - alh * 0.46, alw * 0.48, alh * 0.3, 5, 'rgba(56,220,248,0.22)');

  // Status lamps.
  ['#76dc92', '#38dcf8', '#f5a524'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(cx - alw * 0.18 + i * (alw * 0.18), baseY + alh * 0.08, 2.6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Side solar fins.
  [-1, 1].forEach((side) => {
    ctx.save();
    ctx.translate(cx + side * r * 1.02, baseY - r * 0.22);
    ctx.rotate(side * 0.22);
    const fw = w * 0.17;
    const fh = h * 0.12;
    ctx.fillStyle = '#1b3356';
    fillRoundRect(ctx, -fw / 2, -fh / 2, fw, fh, 3, '#1b3356');
    ctx.strokeStyle = 'rgba(120,180,255,0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-fw / 2 + (fw / 4) * i, -fh / 2);
      ctx.lineTo(-fw / 2 + (fw / 4) * i, fh / 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(150,200,255,0.25)';
    fillRoundRect(ctx, -fw / 2, -fh / 2, fw, fh * 0.35, 3, 'rgba(150,200,255,0.25)');
    ctx.restore();
  });

  // Antenna.
  ctx.strokeStyle = METAL_SHADE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.5, baseY - r * 0.86);
  ctx.lineTo(cx - r * 0.62, baseY - r * 1.3);
  ctx.stroke();
  ctx.fillStyle = '#ff5a3c';
  ctx.beginPath();
  ctx.arc(cx - r * 0.62, baseY - r * 1.34, 3.4, 0, Math.PI * 2);
  ctx.fill();
}

/* ============================================================
   Broken rover
   ============================================================ */
function drawRover(ctx: Ctx, w: number, h: number) {
  groundShadow(ctx, w * 0.5, h * 0.86, w * 0.42, h * 0.1, 0.45);

  ctx.save();
  ctx.translate(w * 0.5, h * 0.58);
  ctx.rotate(0.07);

  // Wheels (back row first).
  const wheelY = h * 0.16;
  const wheelXs = [-w * 0.32, -w * 0.04, w * 0.26];
  wheelXs.forEach((x, i) => {
    ctx.save();
    ctx.translate(x, wheelY + (i === 2 ? 6 : 0));
    if (i === 2) ctx.rotate(0.4); // broken wheel, tilted
    ctx.fillStyle = '#262c36';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 21, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#596477';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 15, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(180,195,214,0.5)';
    ctx.lineWidth = 2;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
      ctx.lineTo(Math.cos(a) * 19, Math.sin(a) * 20);
      ctx.stroke();
    }
    ctx.restore();
  });

  // Chassis.
  const cw = w * 0.72;
  const ch = h * 0.24;
  fillRoundRect(
    ctx,
    -cw / 2,
    -ch * 0.6,
    cw,
    ch,
    8,
    vGrad(ctx, 0, -ch * 0.6, ch * 0.4, [
      [0, METAL_LIGHT],
      [0.45, METAL_MID],
      [1, METAL_DARK],
    ]),
  );
  ctx.strokeStyle = 'rgba(45,54,68,0.6)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, -cw / 2, -ch * 0.6, cw, ch, 8);
  ctx.stroke();
  panelLines(ctx, -cw / 2, -ch * 0.6, cw, ch, 2, 5);

  // Detached solar panel resting on top.
  ctx.save();
  ctx.translate(-w * 0.04, -ch * 0.78);
  ctx.rotate(-0.18);
  const pw = w * 0.46;
  const ph = h * 0.1;
  ctx.fillStyle = '#16294a';
  fillRoundRect(ctx, -pw / 2, -ph / 2, pw, ph, 3, '#16294a');
  ctx.strokeStyle = 'rgba(120,180,255,0.45)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(-pw / 2 + (pw / 6) * i, -ph / 2);
    ctx.lineTo(-pw / 2 + (pw / 6) * i, ph / 2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(160,210,255,0.22)';
  fillRoundRect(ctx, -pw / 2, -ph / 2, pw, ph * 0.4, 3, 'rgba(160,210,255,0.22)');
  ctx.restore();

  // Camera mast (bent).
  ctx.strokeStyle = METAL_SHADE;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.24, -ch * 0.6);
  ctx.lineTo(-w * 0.28, -ch * 1.7);
  ctx.lineTo(-w * 0.18, -ch * 2.1);
  ctx.stroke();
  fillRoundRect(ctx, -w * 0.22, -ch * 2.4, 26, 15, 4, METAL_DARK);
  ctx.fillStyle = 'rgba(56,220,248,0.6)';
  ctx.beginPath();
  ctx.arc(-w * 0.22 + 7, -ch * 2.4 + 7.5, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,90,60,0.9)';
  ctx.beginPath();
  ctx.arc(-w * 0.22 + 18, -ch * 2.4 + 7.5, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Mission marking.
  ctx.fillStyle = '#c1440e';
  ctx.fillRect(-cw * 0.42, -ch * 0.2, cw * 0.84, 5);
  ctx.fillStyle = '#1b2430';
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.fillText('ARES-R2', -cw * 0.4, ch * 0.2);

  weather(ctx, -cw, -ch * 2.4, cw * 2, ch * 3.2, 77);
  ctx.restore();
}

/* ============================================================
   Greenhouse — four construction stages
   ============================================================ */
function drawGreenhouse(ctx: Ctx, w: number, h: number, stage: number) {
  const baseY = h * 0.84;
  const cx = w * 0.5;
  const r = w * 0.34;

  groundShadow(ctx, cx, baseY + 6, r * 1.15, h * 0.08, 0.4);

  // Foundation pad (all stages).
  ctx.fillStyle = 'rgba(70,46,32,0.85)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 2, r * 1.12, h * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56,220,248,0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([9, 7]);
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 2, r * 1.12, h * 0.1, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const ribCount = 7;
  const drawRibs = (alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = METAL_MID;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < ribCount; i++) {
      const t = i / (ribCount - 1);
      const rx = r * (1 - Math.abs(t - 0.5) * 0.12);
      ctx.beginPath();
      ctx.ellipse(cx, baseY, rx * (0.2 + Math.abs(t - 0.5) * 1.6) + 4, r * 0.92, 0, Math.PI, 0);
      ctx.stroke();
    }
    // Horizontal purlins.
    ctx.lineWidth = 3.5;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.ellipse(cx, baseY, r, (r * 0.92 * i) / 3.4, 0, Math.PI, 0);
      ctx.stroke();
    }
    ctx.restore();
  };

  if (stage >= 2) {
    // Glazing shell.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - r, baseY);
    ctx.ellipse(cx, baseY, r, r * 0.92, 0, Math.PI, 0);
    ctx.closePath();
    ctx.clip();

    const lit = stage >= 4;
    ctx.fillStyle = rGrad(
      ctx,
      cx,
      baseY,
      r * 0.1,
      r * 1.3,
      lit
        ? [
            [0, 'rgba(150,240,180,0.6)'],
            [0.5, 'rgba(90,190,130,0.45)'],
            [1, 'rgba(30,70,56,0.5)'],
          ]
        : [
            [0, 'rgba(176,214,235,0.45)'],
            [0.55, 'rgba(120,166,196,0.35)'],
            [1, 'rgba(56,86,108,0.45)'],
          ],
      cx - r * 0.4,
      baseY - r * 0.7,
    );
    ctx.fillRect(cx - r, baseY - r, r * 2, r);

    if (stage >= 3) {
      // Interior: planters and equipment silhouettes.
      ctx.fillStyle = 'rgba(40,52,62,0.75)';
      for (let i = 0; i < 3; i++) {
        const bx = cx - r * 0.62 + i * r * 0.62;
        fillRoundRect(ctx, bx - 22, baseY - 34, 44, 16, 4, 'rgba(44,56,66,0.85)');
        if (stage >= 4) {
          // Plants.
          ctx.fillStyle = '#4fae69';
          for (let k = 0; k < 4; k++) {
            const px = bx - 15 + k * 10;
            ctx.beginPath();
            ctx.ellipse(px, baseY - 40, 5, 9, (k - 1.5) * 0.25, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = 'rgba(44,56,66,0.85)';
        }
      }
      // Grow lamps.
      for (let i = 0; i < 3; i++) {
        const bx = cx - r * 0.62 + i * r * 0.62;
        ctx.fillStyle = stage >= 4 ? 'rgba(190,255,210,0.9)' : 'rgba(120,140,150,0.6)';
        fillRoundRect(ctx, bx - 18, baseY - r * 0.66, 36, 5, 2.5, ctx.fillStyle);
        if (stage >= 4) {
          ctx.fillStyle = 'rgba(140,255,190,0.18)';
          ctx.beginPath();
          ctx.moveTo(bx - 18, baseY - r * 0.66 + 5);
          ctx.lineTo(bx + 18, baseY - r * 0.66 + 5);
          ctx.lineTo(bx + 30, baseY - 18);
          ctx.lineTo(bx - 30, baseY - 18);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Glass reflections.
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.75, baseY);
    ctx.lineTo(cx - r * 0.3, baseY - r * 0.9);
    ctx.lineTo(cx - r * 0.1, baseY - r * 0.9);
    ctx.lineTo(cx - r * 0.5, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawRibs(stage === 1 ? 1 : 0.85);

  if (stage >= 2) {
    // Airlock door at the front.
    fillRoundRect(ctx, cx - 26, baseY - 56, 52, 56, 10, 'rgba(38,46,56,0.95)');
    ctx.strokeStyle = stage >= 4 ? 'rgba(118,220,146,0.9)' : 'rgba(56,220,248,0.7)';
    ctx.lineWidth = 2.4;
    roundRect(ctx, cx - 26, baseY - 56, 52, 56, 10);
    ctx.stroke();
    ctx.fillStyle = stage >= 4 ? 'rgba(118,220,146,0.22)' : 'rgba(56,220,248,0.16)';
    fillRoundRect(ctx, cx - 19, baseY - 48, 38, 30, 6, ctx.fillStyle);
    ctx.fillStyle = stage >= 4 ? '#76dc92' : '#f5a524';
    ctx.beginPath();
    ctx.arc(cx + 18, baseY - 10, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (stage >= 3) {
    // Equipment bay on the left: water recycler + solar feed.
    fillRoundRect(ctx, cx - r - 6, baseY - 46, 34, 46, 6, METAL_MID);
    ctx.strokeStyle = 'rgba(50,60,74,0.6)';
    ctx.lineWidth = 1.4;
    roundRect(ctx, cx - r - 6, baseY - 46, 34, 46, 6);
    ctx.stroke();
    ctx.fillStyle = 'rgba(56,220,248,0.7)';
    ctx.fillRect(cx - r + 2, baseY - 38, 18, 4);
    ctx.fillStyle = 'rgba(118,220,146,0.7)';
    ctx.fillRect(cx - r + 2, baseY - 30, 12, 4);

    // Solar panel on the right.
    ctx.save();
    ctx.translate(cx + r + 14, baseY - 40);
    ctx.rotate(-0.3);
    ctx.fillStyle = '#16294a';
    fillRoundRect(ctx, -26, -14, 52, 28, 3, '#16294a');
    ctx.strokeStyle = 'rgba(120,180,255,0.45)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-26 + (52 / 4) * i, -14);
      ctx.lineTo(-26 + (52 / 4) * i, 14);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(160,210,255,0.25)';
    fillRoundRect(ctx, -26, -14, 52, 10, 3, 'rgba(160,210,255,0.25)');
    ctx.restore();
    ctx.strokeStyle = METAL_SHADE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + r + 14, baseY - 28);
    ctx.lineTo(cx + r + 14, baseY - 2);
    ctx.stroke();
  }

  if (stage >= 4) {
    // Soft green bloom around the structure.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rGrad(ctx, cx, baseY - r * 0.4, 0, r * 1.5, [
      [0, 'rgba(118,220,146,0.22)'],
      [1, 'rgba(118,220,146,0)'],
    ]);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

/* ============================================================
   Transmitter mast
   ============================================================ */
function drawTransmitter(ctx: Ctx, w: number, h: number, repaired: boolean) {
  groundShadow(ctx, w * 0.5, h * 0.9, w * 0.3, h * 0.05, 0.42);

  ctx.save();
  ctx.translate(w * 0.5, h * 0.9);
  ctx.rotate(repaired ? 0 : 0.12);

  // Base plate.
  ctx.fillStyle = METAL_DARK;
  fillRoundRect(ctx, -26, -10, 52, 12, 4, METAL_DARK);

  // Lattice mast.
  const mastH = h * 0.68;
  ctx.strokeStyle = METAL_MID;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(-5, -mastH);
  ctx.moveTo(10, 0);
  ctx.lineTo(5, -mastH);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(180,195,214,0.75)';
  for (let i = 0; i < 9; i++) {
    const y0 = -(mastH / 9) * i;
    const y1 = -(mastH / 9) * (i + 1);
    const x0 = -10 + (5 / 9) * i;
    const x1 = 10 - (5 / 9) * i;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.moveTo(x1, y0);
    ctx.lineTo(x0, y1);
    ctx.stroke();
  }

  if (repaired) {
    // Dish.
    ctx.save();
    ctx.translate(0, -mastH - 6);
    ctx.rotate(-0.4);
    ctx.fillStyle = rGrad(ctx, 0, 0, 2, 34, [
      [0, '#ffffff'],
      [0.5, METAL_MID],
      [1, METAL_SHADE],
    ]);
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = METAL_DARK;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(56,220,248,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = METAL_SHADE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 20);
    ctx.stroke();
    ctx.fillStyle = '#38dcf8';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Empty, bent mount.
    ctx.strokeStyle = METAL_SHADE;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -mastH);
    ctx.lineTo(16, -mastH - 14);
    ctx.stroke();
    ctx.fillStyle = '#ff5a3c';
    ctx.beginPath();
    ctx.arc(16, -mastH - 16, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Guy wires.
  ctx.strokeStyle = 'rgba(180,195,214,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-6, -mastH * 0.8);
  ctx.lineTo(-40, 0);
  ctx.moveTo(6, -mastH * 0.8);
  ctx.lineTo(40, 0);
  ctx.stroke();
  ctx.restore();
}

export function createStructureTextures(scene: Phaser.Scene) {
  canvasTex(scene, 'prop_ship', 500, 340, drawShip);
  canvasTex(scene, 'prop_shelter', 320, 250, drawShelter);
  canvasTex(scene, 'prop_rover', 260, 170, drawRover);
  for (let stage = 1; stage <= 4; stage++) {
    canvasTex(scene, `prop_greenhouse_${stage}`, 340, 250, (ctx, w, h) =>
      drawGreenhouse(ctx, w, h, stage),
    );
  }
  canvasTex(scene, 'prop_transmitter', 150, 260, (ctx, w, h) => drawTransmitter(ctx, w, h, false));
  canvasTex(scene, 'prop_transmitter_fixed', 150, 260, (ctx, w, h) =>
    drawTransmitter(ctx, w, h, true),
  );
}
