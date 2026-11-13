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
const METAL_MID = '#c7d0da';
const METAL_SHADE = '#94a0ad';
const METAL_DARK = '#5a6675';

function panelLines(ctx: Ctx, x: number, y: number, w: number, h: number, step: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(90,104,120,0.22)';
  ctx.lineWidth = 1;
  for (let i = x + step; i < x + w; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, y);
    ctx.lineTo(i, y + h);
    ctx.stroke();
  }
  ctx.restore();
}

/* ============================================================
   Room shell
   ============================================================ */
function drawFloor(ctx: Ctx, size: number) {
  const rng = makeRng(4411);
  ctx.fillStyle = '#3c3831';
  ctx.fillRect(0, 0, size, size);

  // Narrow composite decking boards.
  for (let y = 0; y < size; y += 42) {
    for (let x = 0; x < size; x += 86) {
      const offset = (y / 42) % 2 ? 43 : 0;
      const v = rng();
      ctx.fillStyle = `rgb(${68 + v * 12},${63 + v * 11},${55 + v * 10})`;
      fillRoundRect(ctx, x + offset + 1.5, y + 1.5, 83, 39, 3, ctx.fillStyle);
      ctx.strokeStyle = 'rgba(26,23,20,0.65)';
      ctx.lineWidth = 1;
      roundRect(ctx, x + offset + 1.5, y + 1.5, 83, 39, 3);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,236,208,0.05)';
      ctx.fillRect(x + offset + 3, y + 3, 79, 1.5);
      // Grip ribbing.
      ctx.fillStyle = 'rgba(20,18,16,0.18)';
      for (let r = 0; r < 4; r++) ctx.fillRect(x + offset + 8 + r * 18, y + 8, 2, 26);
    }
  }

  // Tracked-in regolith, damp patches, scuffs.
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(${150 + rng() * 40},${88 + rng() * 30},${48 + rng() * 20},${0.06 + rng() * 0.16})`;
    ctx.beginPath();
    ctx.ellipse(rng() * size, rng() * size, 10 + rng() * 34, 6 + rng() * 18, rng() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 14; i++) {
    ctx.strokeStyle = `rgba(22,20,18,${0.08 + rng() * 0.1})`;
    ctx.lineWidth = 1 + rng() * 2;
    ctx.beginPath();
    const x = rng() * size;
    const y = rng() * size;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rng() - 0.5) * 60, y + (rng() - 0.5) * 30);
    ctx.stroke();
  }
  speckle(ctx, 0, 0, size, size, 300, ['rgba(255,236,208,0.05)', 'rgba(0,0,0,0.2)'], rng, 1.8);
}

function drawWallPanel(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = vGrad(ctx, 0, 0, h, [
    [0, '#dfe6ee'],
    [0.55, '#c6d0da'],
    [1, '#96a3b1'],
  ]);
  ctx.fillRect(0, 0, w, h);
  panelLines(ctx, 0, 0, w, h, 48);
  ctx.strokeStyle = 'rgba(80,94,110,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, h - 12);
  ctx.lineTo(w, h - 12);
  ctx.stroke();
  ctx.fillStyle = 'rgba(118,220,146,0.1)';
  ctx.fillRect(0, h - 10, w, 10);
  const rng = makeRng(77);
  speckle(ctx, 0, 0, w, h, 60, ['rgba(255,255,255,0.08)', 'rgba(60,70,84,0.1)'], rng, 1.6);
}

/** The dome glazing: warm Mars daylight outside, condensation inside. */
function drawGlass(ctx: Ctx, w: number, h: number) {
  const rng = makeRng(991);
  // Blurred Martian outside.
  const sky = vGrad(ctx, 0, 0, h * 0.62, [
    [0, '#caa07c'],
    [0.5, '#d9ab82'],
    [1, '#e5bd96'],
  ]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.62);
  ctx.fillStyle = vGrad(ctx, 0, h * 0.58, h, [
    [0, '#b4713f'],
    [1, '#9b5c30'],
  ]);
  ctx.fillRect(0, h * 0.58, w, h * 0.42);

  // Soft hills, intentionally out of focus.
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(150,92,56,0.55)' : 'rgba(176,112,70,0.5)';
    ctx.beginPath();
    ctx.ellipse(rng() * w, h * (0.5 + rng() * 0.12), 60 + rng() * 90, 18 + rng() * 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Green tint from the interior.
  ctx.fillStyle = 'rgba(126,196,142,0.12)';
  ctx.fillRect(0, 0, w, h);

  // Glazing bars.
  ctx.fillStyle = 'rgba(214,224,234,0.85)';
  ctx.fillRect(0, 0, w, 10);
  ctx.fillRect(0, h - 14, w, 14);
  for (let x = 0; x < w; x += 128) {
    ctx.fillStyle = 'rgba(206,218,230,0.8)';
    ctx.fillRect(x, 0, 9, h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x, 0, 3, h);
  }

  // Condensation.
  for (let i = 0; i < 90; i++) {
    const x = rng() * w;
    const y = 12 + rng() * (h - 30);
    const r = 1 + rng() * 3.4;
    ctx.fillStyle = `rgba(236,248,255,${0.1 + rng() * 0.26})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    if (rng() > 0.72) {
      ctx.fillStyle = 'rgba(236,248,255,0.14)';
      ctx.fillRect(x - 0.6, y, 1.2, 6 + rng() * 16);
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w * 0.4, 0);
  ctx.lineTo(w * 0.52, 0);
  ctx.lineTo(w * 0.12, h);
  ctx.closePath();
  ctx.fill();
}

/* ============================================================
   Fixtures
   ============================================================ */
function drawBed(ctx: Ctx, w: number, h: number) {
  groundShadow(ctx, w / 2, h * 0.9, w * 0.46, h * 0.12, 0.5);

  // Legs first, behind the box.
  ctx.fillStyle = '#4a5460';
  ctx.fillRect(w * 0.14, h * 0.74, 11, h * 0.2);
  ctx.fillRect(w * 0.83, h * 0.74, 11, h * 0.2);

  // Front face of the trough, so the bed reads as a raised box.
  fillRoundRect(ctx, w * 0.06, h * 0.56, w * 0.88, h * 0.26, 8, vGrad(ctx, 0, h * 0.56, h * 0.82, [
    [0, METAL_MID],
    [1, '#55616f'],
  ]));
  ctx.strokeStyle = 'rgba(32,40,50,0.7)';
  ctx.lineWidth = 1.8;
  roundRect(ctx, w * 0.06, h * 0.56, w * 0.88, h * 0.26, 8);
  ctx.stroke();

  // Top rim.
  fillRoundRect(ctx, w * 0.04, h * 0.24, w * 0.92, h * 0.38, 10, vGrad(ctx, 0, h * 0.24, h * 0.62, [
    [0, METAL_LIGHT],
    [0.6, METAL_MID],
    [1, METAL_SHADE],
  ]));
  ctx.strokeStyle = 'rgba(32,40,50,0.65)';
  ctx.lineWidth = 1.8;
  roundRect(ctx, w * 0.04, h * 0.24, w * 0.92, h * 0.38, 10);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(w * 0.07, h * 0.26, w * 0.86, 2);

  // Recessed well the soil sits in.
  fillRoundRect(ctx, w * 0.1, h * 0.29, w * 0.8, h * 0.28, 6, '#241f1a');
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  fillRoundRect(ctx, w * 0.1, h * 0.29, w * 0.8, h * 0.07, 6, 'rgba(0,0,0,0.45)');

  // Label plate.
  fillRoundRect(ctx, w * 0.37, h * 0.63, w * 0.26, 13, 3, '#232a34');
  ctx.fillStyle = 'rgba(118,220,146,0.85)';
  ctx.fillRect(w * 0.39, h * 0.665, w * 0.09, 3);
  ctx.fillStyle = 'rgba(190,210,230,0.5)';
  ctx.fillRect(w * 0.51, h * 0.665, w * 0.1, 3);
}

/** Growing medium, drawn separately so it can be tinted as it dries. */
function drawSoil(ctx: Ctx, w: number, h: number) {
  const rng = makeRng(321);
  fillRoundRect(ctx, 0, 0, w, h, 6, '#6b5440');
  ctx.save();
  roundRect(ctx, 0, 0, w, h, 6);
  ctx.clip();
  for (let i = 0; i < 160; i++) {
    const g = rng();
    ctx.fillStyle = g > 0.6 ? 'rgba(126,100,74,0.9)' : g > 0.3 ? 'rgba(84,64,46,0.9)' : 'rgba(150,120,88,0.7)';
    ctx.fillRect(rng() * w, rng() * h, 1.5 + rng() * 3, 1.5 + rng() * 2.4);
  }
  // Perlite flecks.
  ctx.fillStyle = 'rgba(236,236,230,0.6)';
  for (let i = 0; i < 26; i++) ctx.fillRect(rng() * w, rng() * h, 2, 2);
  ctx.fillStyle = vGrad(ctx, 0, 0, h, [
    [0, 'rgba(255,240,220,0.14)'],
    [1, 'rgba(20,12,6,0.26)'],
  ]);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawTank(ctx: Ctx, w: number, h: number) {
  groundShadow(ctx, w / 2, h * 0.94, w * 0.38, h * 0.05, 0.4);
  // Body.
  fillRoundRect(ctx, w * 0.18, h * 0.14, w * 0.64, h * 0.76, 16, vGrad(ctx, 0, h * 0.14, h * 0.9, [
    [0, METAL_LIGHT],
    [0.45, METAL_MID],
    [1, METAL_DARK],
  ]));
  ctx.strokeStyle = 'rgba(70,84,100,0.6)';
  ctx.lineWidth = 1.8;
  roundRect(ctx, w * 0.18, h * 0.14, w * 0.64, h * 0.76, 16);
  ctx.stroke();
  // Sight glass.
  fillRoundRect(ctx, w * 0.42, h * 0.22, w * 0.16, h * 0.58, 5, '#0d2430');
  ctx.fillStyle = vGrad(ctx, 0, h * 0.4, h * 0.78, [
    [0, 'rgba(110,210,255,0.95)'],
    [1, 'rgba(22,118,168,0.95)'],
  ]);
  fillRoundRect(ctx, w * 0.44, h * 0.4, w * 0.12, h * 0.38, 3, ctx.fillStyle);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(w * 0.455, h * 0.43, 2.5, h * 0.3);
  // Tap and hose.
  ctx.strokeStyle = METAL_SHADE;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(w * 0.8, h * 0.62);
  ctx.quadraticCurveTo(w * 0.96, h * 0.66, w * 0.92, h * 0.86);
  ctx.stroke();
  ctx.fillStyle = '#38dcf8';
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b2430';
  ctx.font = 'bold 10px ui-monospace, monospace';
  ctx.fillText('H2O', w * 0.3, h * 0.2);
}

function drawShelf(ctx: Ctx, w: number, h: number) {
  groundShadow(ctx, w / 2, h * 0.95, w * 0.4, h * 0.04, 0.35);
  fillRoundRect(ctx, w * 0.08, h * 0.08, w * 0.84, h * 0.84, 8, vGrad(ctx, 0, 0, h, [
    [0, '#d9ccb8'],
    [1, '#9c8a72'],
  ]));
  ctx.strokeStyle = 'rgba(70,58,44,0.5)';
  ctx.lineWidth = 1.6;
  roundRect(ctx, w * 0.08, h * 0.08, w * 0.84, h * 0.84, 8);
  ctx.stroke();

  const rng = makeRng(515);
  const jarColours = ['#cfa468', '#8fcc62', '#e04a33', '#6fd38a', '#e3c766'];
  for (let shelf = 0; shelf < 3; shelf++) {
    const y = h * (0.24 + shelf * 0.26);
    ctx.fillStyle = 'rgba(60,48,36,0.55)';
    ctx.fillRect(w * 0.1, y + h * 0.11, w * 0.8, 4);
    for (let j = 0; j < 4; j++) {
      const x = w * (0.17 + j * 0.2);
      const jh = h * 0.1;
      ctx.fillStyle = 'rgba(224,238,246,0.75)';
      fillRoundRect(ctx, x - 9, y, 18, jh, 3, 'rgba(224,238,246,0.75)');
      ctx.fillStyle = jarColours[(shelf * 4 + j) % jarColours.length];
      fillRoundRect(ctx, x - 7, y + jh * 0.45, 14, jh * 0.5, 2, ctx.fillStyle);
      ctx.fillStyle = 'rgba(120,134,152,0.9)';
      ctx.fillRect(x - 9, y - 3, 18, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x - 7, y + 2, 3, jh * 0.4);
      void rng;
    }
  }
  // Hand-written label.
  ctx.fillStyle = '#3b2b1c';
  ctx.font = 'italic bold 13px "Segoe Print", "Comic Sans MS", cursive';
  ctx.fillText('seeds', w * 0.36, h * 0.2);
}

function drawBench(ctx: Ctx, w: number, h: number) {
  groundShadow(ctx, w / 2, h * 0.93, w * 0.42, h * 0.06, 0.4);
  // Top.
  fillRoundRect(ctx, w * 0.05, h * 0.38, w * 0.9, h * 0.16, 6, vGrad(ctx, 0, h * 0.38, h * 0.54, [
    [0, '#c9b79c'],
    [1, '#8d7a60'],
  ]));
  // Legs.
  ctx.fillStyle = METAL_DARK;
  ctx.fillRect(w * 0.12, h * 0.52, 12, h * 0.4);
  ctx.fillRect(w * 0.82, h * 0.52, 12, h * 0.4);
  // Console screen.
  fillRoundRect(ctx, w * 0.3, h * 0.08, w * 0.4, h * 0.3, 6, '#1b2430');
  ctx.strokeStyle = 'rgba(56,220,248,0.6)';
  ctx.lineWidth = 1.6;
  roundRect(ctx, w * 0.3, h * 0.08, w * 0.4, h * 0.3, 6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(56,220,248,0.22)';
  fillRoundRect(ctx, w * 0.33, h * 0.12, w * 0.34, h * 0.21, 3, 'rgba(56,220,248,0.22)');
  ctx.fillStyle = 'rgba(160,240,255,0.85)';
  for (let i = 0; i < 4; i++) ctx.fillRect(w * 0.35, h * (0.15 + i * 0.04), w * (0.1 + i * 0.05), 2);
  // Tools.
  ctx.strokeStyle = '#6b7484';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.36);
  ctx.lineTo(w * 0.2, h * 0.3);
  ctx.stroke();
  ctx.fillStyle = '#8d5a3a';
  fillRoundRect(ctx, w * 0.74, h * 0.28, 22, 10, 3, '#8d5a3a');
}

function drawCompost(ctx: Ctx, w: number, h: number) {
  groundShadow(ctx, w / 2, h * 0.93, w * 0.36, h * 0.05, 0.35);
  fillRoundRect(ctx, w * 0.14, h * 0.24, w * 0.72, h * 0.68, 8, vGrad(ctx, 0, h * 0.24, h * 0.92, [
    [0, '#5c6a52'],
    [1, '#33402e'],
  ]));
  ctx.strokeStyle = 'rgba(30,40,26,0.7)';
  ctx.lineWidth = 1.6;
  roundRect(ctx, w * 0.14, h * 0.24, w * 0.72, h * 0.68, 8);
  ctx.stroke();
  // Open lid showing compost.
  fillRoundRect(ctx, w * 0.1, h * 0.16, w * 0.8, h * 0.12, 5, '#44513c');
  const rng = makeRng(808);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = rng() > 0.5 ? 'rgba(92,70,44,0.9)' : 'rgba(60,46,28,0.9)';
    ctx.fillRect(w * 0.2 + rng() * w * 0.6, h * 0.19 + rng() * h * 0.06, 3, 2.4);
  }
  ctx.fillStyle = 'rgba(214,230,210,0.85)';
  ctx.font = 'bold 9px ui-monospace, monospace';
  ctx.fillText('COMPOST', w * 0.22, h * 0.56);
}

function drawLamp(ctx: Ctx, w: number, h: number, on: boolean) {
  // Hangers.
  ctx.strokeStyle = '#7d8a99';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.22, 0);
  ctx.lineTo(w * 0.26, h * 0.42);
  ctx.moveTo(w * 0.78, 0);
  ctx.lineTo(w * 0.74, h * 0.42);
  ctx.stroke();
  // Housing.
  fillRoundRect(ctx, w * 0.12, h * 0.38, w * 0.76, h * 0.34, 6, vGrad(ctx, 0, h * 0.38, h * 0.72, [
    [0, METAL_LIGHT],
    [1, METAL_DARK],
  ]));
  ctx.strokeStyle = 'rgba(70,84,100,0.6)';
  ctx.lineWidth = 1.4;
  roundRect(ctx, w * 0.12, h * 0.38, w * 0.76, h * 0.34, 6);
  ctx.stroke();
  // Tubes.
  for (let i = 0; i < 3; i++) {
    const y = h * (0.62 + i * 0.08);
    ctx.fillStyle = on ? 'rgba(206,255,226,0.95)' : 'rgba(150,164,176,0.75)';
    fillRoundRect(ctx, w * 0.16, y, w * 0.68, 5, 2.5, ctx.fillStyle);
  }
  if (on) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rGrad(ctx, w / 2, h * 0.72, 0, w * 0.5, [
      [0, 'rgba(180,255,210,0.5)'],
      [1, 'rgba(180,255,210,0)'],
    ]);
    ctx.fillRect(0, h * 0.4, w, h * 0.6);
    ctx.restore();
  }
}

function drawLightCone(ctx: Ctx, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(188,255,214,0.42)');
  grad.addColorStop(0.55, 'rgba(170,246,200,0.16)');
  grad.addColorStop(1, 'rgba(160,240,190,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(w * 0.34, 0);
  ctx.lineTo(w * 0.66, 0);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
}

function drawAirlock(ctx: Ctx, w: number, h: number) {
  // Frame.
  fillRoundRect(ctx, w * 0.06, h * 0.04, w * 0.88, h * 0.92, 12, vGrad(ctx, 0, 0, h, [
    [0, METAL_LIGHT],
    [0.5, METAL_MID],
    [1, METAL_DARK],
  ]));
  ctx.strokeStyle = 'rgba(70,84,100,0.6)';
  ctx.lineWidth = 2;
  roundRect(ctx, w * 0.06, h * 0.04, w * 0.88, h * 0.92, 12);
  ctx.stroke();
  // Door.
  fillRoundRect(ctx, w * 0.16, h * 0.14, w * 0.68, h * 0.74, 8, '#39434f');
  ctx.strokeStyle = 'rgba(56,220,248,0.75)';
  ctx.lineWidth = 2.4;
  roundRect(ctx, w * 0.16, h * 0.14, w * 0.68, h * 0.74, 8);
  ctx.stroke();
  // Window onto the red world.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.36, w * 0.19, h * 0.14, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#c9814f';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#9d5a2e';
  ctx.fillRect(0, h * 0.38, w, h);
  ctx.restore();
  ctx.strokeStyle = 'rgba(210,224,236,0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.36, w * 0.19, h * 0.14, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Wheel handle and status lamp.
  ctx.strokeStyle = METAL_SHADE;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.64, w * 0.12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.38, h * 0.64);
  ctx.lineTo(w * 0.62, h * 0.64);
  ctx.moveTo(w * 0.5, h * 0.52);
  ctx.lineTo(w * 0.5, h * 0.76);
  ctx.stroke();
  ctx.fillStyle = '#76dc92';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.88, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawSwitch(ctx: Ctx, w: number, h: number, on: boolean) {
  fillRoundRect(ctx, w * 0.2, h * 0.14, w * 0.6, h * 0.72, 6, '#2b323d');
  ctx.strokeStyle = on ? 'rgba(118,220,146,0.9)' : 'rgba(140,152,166,0.6)';
  ctx.lineWidth = 1.8;
  roundRect(ctx, w * 0.2, h * 0.14, w * 0.6, h * 0.72, 6);
  ctx.stroke();
  fillRoundRect(ctx, w * 0.32, on ? h * 0.22 : h * 0.5, w * 0.36, h * 0.28, 4, on ? '#76dc92' : '#7d8a99');
  ctx.fillStyle = on ? 'rgba(118,220,146,0.9)' : 'rgba(150,162,176,0.8)';
  ctx.font = 'bold 8px ui-monospace, monospace';
  ctx.fillText(on ? 'ON' : 'OFF', w * 0.3, h * 0.98);
}

function drawBreaker(ctx: Ctx, w: number, h: number) {
  fillRoundRect(ctx, w * 0.1, h * 0.08, w * 0.8, h * 0.84, 7, vGrad(ctx, 0, 0, h, [
    [0, '#dbe3ec'],
    [1, '#8e9aa8'],
  ]));
  ctx.strokeStyle = 'rgba(70,84,100,0.6)';
  ctx.lineWidth = 1.6;
  roundRect(ctx, w * 0.1, h * 0.08, w * 0.8, h * 0.84, 7);
  ctx.stroke();
  fillRoundRect(ctx, w * 0.2, h * 0.2, w * 0.6, h * 0.3, 4, '#2b323d');
  ctx.fillStyle = '#f5a524';
  ctx.fillRect(w * 0.26, h * 0.28, w * 0.2, h * 0.14);
  ctx.fillStyle = '#76dc92';
  ctx.fillRect(w * 0.54, h * 0.28, w * 0.2, h * 0.14);
  ctx.fillStyle = '#39434f';
  ctx.font = 'bold 8px ui-monospace, monospace';
  ctx.fillText('MAIN', w * 0.3, h * 0.68);
  fillRoundRect(ctx, w * 0.3, h * 0.72, w * 0.4, h * 0.14, 3, '#5a6675');
}

/* ============================================================
   Human touches
   ============================================================ */
function drawSign(ctx: Ctx, w: number, h: number) {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-0.02);
  // Weathered board.
  fillRoundRect(ctx, -w * 0.46, -h * 0.34, w * 0.92, h * 0.68, 6, vGrad(ctx, 0, -h * 0.34, h * 0.34, [
    [0, '#d8c09a'],
    [1, '#a98a63'],
  ]));
  ctx.strokeStyle = 'rgba(86,64,40,0.7)';
  ctx.lineWidth = 2;
  roundRect(ctx, -w * 0.46, -h * 0.34, w * 0.92, h * 0.68, 6);
  ctx.stroke();
  const rng = makeRng(223);
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(120,92,60,${0.08 + rng() * 0.12})`;
    ctx.fillRect(-w * 0.45 + rng() * w * 0.9, -h * 0.33 + rng() * h * 0.66, 14 + rng() * 30, 2);
  }
  // Hand-painted lettering.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2f6b3f';
  ctx.font = 'italic bold 17px "Segoe Print", "Comic Sans MS", cursive';
  ctx.fillText('Welcome to', 0, -h * 0.04);
  ctx.font = 'italic bold 21px "Segoe Print", "Comic Sans MS", cursive';
  ctx.fillText('Sheltered Hollow', 0, h * 0.22);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawMug(ctx: Ctx, w: number, h: number) {
  groundShadow(ctx, w / 2, h * 0.88, w * 0.3, h * 0.08, 0.35);
  fillRoundRect(ctx, w * 0.22, h * 0.3, w * 0.46, h * 0.56, 5, vGrad(ctx, 0, h * 0.3, h * 0.86, [
    [0, '#f2f5f9'],
    [1, '#b9c3cd'],
  ]));
  ctx.strokeStyle = 'rgba(80,94,110,0.5)';
  ctx.lineWidth = 1.2;
  roundRect(ctx, w * 0.22, h * 0.3, w * 0.46, h * 0.56, 5);
  ctx.stroke();
  ctx.strokeStyle = '#c1440e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.24, h * 0.46);
  ctx.lineTo(w * 0.66, h * 0.46);
  ctx.stroke();
  ctx.strokeStyle = '#cdd6e0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(w * 0.72, h * 0.54, w * 0.12, -1.2, 1.2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(90,60,30,0.85)';
  ctx.beginPath();
  ctx.ellipse(w * 0.45, h * 0.33, w * 0.2, h * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPhoto(ctx: Ctx, w: number, h: number) {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-0.08);
  fillRoundRect(ctx, -w * 0.4, -h * 0.44, w * 0.8, h * 0.88, 2, '#f3efe6');
  ctx.strokeStyle = 'rgba(60,54,46,0.4)';
  ctx.lineWidth = 1;
  roundRect(ctx, -w * 0.4, -h * 0.44, w * 0.8, h * 0.88, 2);
  ctx.stroke();
  // A blue-sky snapshot: two figures, a dog, a very green field.
  const img = { x: -w * 0.34, y: -h * 0.38, w: w * 0.68, h: h * 0.6 };
  ctx.fillStyle = '#8fc3e8';
  ctx.fillRect(img.x, img.y, img.w, img.h);
  ctx.fillStyle = '#5a9f55';
  ctx.fillRect(img.x, img.y + img.h * 0.62, img.w, img.h * 0.38);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(img.x + img.w * 0.78, img.y + img.h * 0.22, img.w * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3c4654';
  ctx.fillRect(img.x + img.w * 0.3, img.y + img.h * 0.45, 4, img.h * 0.3);
  ctx.fillRect(img.x + img.w * 0.45, img.y + img.h * 0.48, 4, img.h * 0.27);
  ctx.fillStyle = '#6b4a2e';
  ctx.fillRect(img.x + img.w * 0.58, img.y + img.h * 0.68, 6, 4);
  // Tape.
  ctx.fillStyle = 'rgba(236,230,214,0.6)';
  ctx.fillRect(-w * 0.16, -h * 0.5, w * 0.32, h * 0.1);
  ctx.restore();
}

function drawCrate(ctx: Ctx, w: number, h: number) {
  groundShadow(ctx, w / 2, h * 0.9, w * 0.4, h * 0.08, 0.4);
  fillRoundRect(ctx, w * 0.12, h * 0.3, w * 0.76, h * 0.56, 5, vGrad(ctx, 0, h * 0.3, h * 0.86, [
    [0, '#c7a06a'],
    [1, '#86603a'],
  ]));
  ctx.strokeStyle = 'rgba(60,42,24,0.6)';
  ctx.lineWidth = 1.6;
  roundRect(ctx, w * 0.12, h * 0.3, w * 0.76, h * 0.56, 5);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,210,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.14, h * 0.48);
  ctx.lineTo(w * 0.86, h * 0.48);
  ctx.moveTo(w * 0.14, h * 0.66);
  ctx.lineTo(w * 0.86, h * 0.66);
  ctx.stroke();
}


function drawPotted(ctx: Ctx, w: number, h: number) {
  groundShadow(ctx, w / 2, h * 0.92, w * 0.3, h * 0.06, 0.35);
  fillRoundRect(ctx, w * 0.26, h * 0.56, w * 0.48, h * 0.36, 4, '#a2603c');
  ctx.fillStyle = '#5b4430';
  fillRoundRect(ctx, w * 0.3, h * 0.56, w * 0.4, h * 0.08, 2, '#5b4430');
  ctx.strokeStyle = '#4f9a4f';
  ctx.lineWidth = 2.4;
  for (let i = 0; i < 5; i++) {
    const lean = (i - 2) * 6;
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.58);
    ctx.quadraticCurveTo(w / 2 + lean * 0.6, h * 0.36, w / 2 + lean, h * 0.2);
    ctx.stroke();
  }
  ctx.fillStyle = '#76c46f';
  for (let i = 0; i < 5; i++) {
    const lean = (i - 2) * 6;
    ctx.beginPath();
    ctx.ellipse(w / 2 + lean, h * 0.2, 5, 8, lean * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCan(ctx: Ctx, w: number, h: number) {
  groundShadow(ctx, w / 2, h * 0.9, w * 0.3, h * 0.07, 0.3);
  fillRoundRect(ctx, w * 0.2, h * 0.34, w * 0.5, h * 0.5, 5, vGrad(ctx, 0, h * 0.34, h * 0.84, [
    [0, '#8fd8ff'],
    [1, '#2f8ed6'],
  ]));
  ctx.strokeStyle = 'rgba(20,60,90,0.5)';
  ctx.lineWidth = 1.2;
  roundRect(ctx, w * 0.2, h * 0.34, w * 0.5, h * 0.5, 5);
  ctx.stroke();
  ctx.strokeStyle = '#5ab4e8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w * 0.68, h * 0.44);
  ctx.lineTo(w * 0.92, h * 0.26);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w * 0.42, h * 0.3, w * 0.14, Math.PI, 0);
  ctx.stroke();
}

/* ============================================================
   Registration
   ============================================================ */
export function createInteriorTextures(scene: Phaser.Scene) {
  canvasTex(scene, 'gh_floor', 256, 256, (ctx, w) => drawFloor(ctx, w));
  canvasTex(scene, 'gh_wall', 256, 160, drawWallPanel);
  canvasTex(scene, 'gh_glass', 512, 240, drawGlass);
  canvasTex(scene, 'gh_bed', 210, 130, drawBed);
  canvasTex(scene, 'gh_soil', 168, 62, drawSoil);
  canvasTex(scene, 'gh_tank', 150, 190, drawTank);
  canvasTex(scene, 'gh_shelf', 180, 160, drawShelf);
  canvasTex(scene, 'gh_bench', 220, 140, drawBench);
  canvasTex(scene, 'gh_compost', 120, 130, drawCompost);
  canvasTex(scene, 'gh_lamp_on', 190, 70, (ctx, w, h) => drawLamp(ctx, w, h, true));
  canvasTex(scene, 'gh_lamp_off', 190, 70, (ctx, w, h) => drawLamp(ctx, w, h, false));
  canvasTex(scene, 'gh_lightcone', 240, 220, drawLightCone);
  canvasTex(scene, 'gh_airlock', 190, 210, drawAirlock);
  canvasTex(scene, 'gh_switch_on', 58, 74, (ctx, w, h) => drawSwitch(ctx, w, h, true));
  canvasTex(scene, 'gh_switch_off', 58, 74, (ctx, w, h) => drawSwitch(ctx, w, h, false));
  canvasTex(scene, 'gh_breaker', 86, 108, drawBreaker);
  canvasTex(scene, 'gh_sign', 260, 86, drawSign);
  canvasTex(scene, 'gh_mug', 44, 46, drawMug);
  canvasTex(scene, 'gh_photo', 58, 68, drawPhoto);
  canvasTex(scene, 'gh_crate', 96, 86, drawCrate);
  canvasTex(scene, 'gh_potted', 64, 86, drawPotted);
  canvasTex(scene, 'gh_can', 60, 54, drawCan);
}
