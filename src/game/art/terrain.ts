import {
  blobPath,
  canvasTex,
  groundShadow,
  hexStr,
  makeFbm,
  makeRng,
  mixHex,
  rGrad,
  speckle,
  vGrad,
  type Ctx,
} from './draw';

/* ============================================================
   Ground
   ============================================================ */
const GROUND_SIZE = 256;

/** Seamless Martian regolith tile. */
function drawGroundTile(ctx: Ctx, size: number, seed: number, palette: [number, number, number][]) {
  const fbm = makeFbm(seed, 5, 4);
  const detail = makeFbm(seed + 1234, 3, 16);
  const image = ctx.createImageData(size, size);
  const data = image.data;
  const period = 4;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * period;
      const v = (y / size) * period;
      let n = fbm(u, v);
      n = n * 0.72 + detail((x / size) * 16, (y / size) * 16) * 0.28;
      const t = Math.max(0, Math.min(1, (n - 0.28) / 0.46));

      // Blend across three palette stops.
      let r: number;
      let g: number;
      let b: number;
      if (t < 0.5) {
        const k = t / 0.5;
        r = palette[0][0] + (palette[1][0] - palette[0][0]) * k;
        g = palette[0][1] + (palette[1][1] - palette[0][1]) * k;
        b = palette[0][2] + (palette[1][2] - palette[0][2]) * k;
      } else {
        const k = (t - 0.5) / 0.5;
        r = palette[1][0] + (palette[2][0] - palette[1][0]) * k;
        g = palette[1][1] + (palette[2][1] - palette[1][1]) * k;
        b = palette[1][2] + (palette[2][2] - palette[1][2]) * k;
      }

      const grain = (Math.random() - 0.5) * 13;
      const i = (y * size + x) * 4;
      data[i] = Math.max(0, Math.min(255, r + grain));
      data[i + 1] = Math.max(0, Math.min(255, g + grain));
      data[i + 2] = Math.max(0, Math.min(255, b + grain));
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  // Scattered grit so the tile does not read as pure noise.
  const rng = makeRng(seed * 31 + 7);
  speckle(
    ctx,
    0,
    0,
    size,
    size,
    420,
    ['rgba(60,32,18,0.45)', 'rgba(222,170,124,0.32)', 'rgba(40,22,14,0.3)'],
    rng,
    2.2,
  );
  // A few pebbles with a highlight and shadow.
  for (let i = 0; i < 26; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 1.6 + rng() * 3.2;
    ctx.fillStyle = 'rgba(35,19,11,0.35)';
    ctx.beginPath();
    ctx.ellipse(x + 0.8, y + 1.2, r, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(${150 + rng() * 50},${95 + rng() * 40},${65 + rng() * 30},0.85)`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.72, rng() * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,215,180,0.3)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.25, y - r * 0.3, r * 0.4, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ============================================================
   Region overlays — large soft patches that recolour an area
   ============================================================ */
function drawRegionPatch(
  ctx: Ctx,
  size: number,
  seed: number,
  color: string,
  accent: string,
  style: 'smooth' | 'ripple' | 'striated',
) {
  const rng = makeRng(seed);
  ctx.save();

  // 1. Paint the region colour and its pattern normally.
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  if (style === 'ripple') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 30; i++) {
      const y = rng() * size;
      ctx.globalAlpha = 0.18 + rng() * 0.26;
      ctx.beginPath();
      ctx.moveTo(-20, y);
      for (let x = -20; x < size + 20; x += 24) {
        ctx.quadraticCurveTo(x + 12, y + Math.sin(x * 0.05 + i) * 9, x + 24, y);
      }
      ctx.stroke();
    }
  } else if (style === 'striated') {
    for (let i = 0; i < 26; i++) {
      ctx.globalAlpha = 0.12 + rng() * 0.26;
      ctx.fillStyle = i % 2 ? accent : 'rgba(40,22,13,0.6)';
      const y = rng() * size;
      ctx.fillRect(0, y, size, 5 + rng() * 18);
    }
  } else {
    for (let i = 0; i < 18; i++) {
      ctx.globalAlpha = 0.12 + rng() * 0.18;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.ellipse(
        rng() * size,
        rng() * size,
        30 + rng() * 90,
        20 + rng() * 60,
        rng() * 3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
  speckle(ctx, 0, 0, size, size, 380, ['rgba(255,236,210,0.12)', 'rgba(0,0,0,0.16)'], rng, 2.6);

  // 2. Feather the edges in a single destination-in pass so the patch blends
  //    into the base ground instead of showing a hard circle.
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = rGrad(ctx, size / 2, size / 2, 0, size / 2, [
    [0, 'rgba(255,255,255,1)'],
    [0.5, 'rgba(255,255,255,0.95)'],
    [0.78, 'rgba(255,255,255,0.45)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  ctx.fillRect(0, 0, size, size);
  ctx.restore();
}

/* ============================================================
   Rocks, boulders, craters, dunes
   ============================================================ */
function drawRock(ctx: Ctx, size: number, seed: number, tint: [number, number, number]) {
  const rng = makeRng(seed);
  const cx = size / 2;
  const cy = size * 0.54;
  const r = size * 0.34;

  // Angular silhouette — Martian rock is fractured, not rounded.
  const corners = 7 + Math.floor(rng() * 3);
  const pts: [number, number][] = [];
  for (let i = 0; i < corners; i++) {
    const angle = (i / corners) * Math.PI * 2 + (rng() - 0.5) * 0.3;
    const radius = r * (0.68 + rng() * 0.42);
    pts.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * 0.78]);
  }
  const trace = () => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  };

  // Cast shadow, thrown down-right by the high sun.
  groundShadow(ctx, cx + r * 0.42, cy + r * 0.58, r * 1.25, r * 0.46, 0.52);

  trace();
  ctx.fillStyle = hexStr(tint[2]);
  ctx.fill();

  // Facets lit from the upper left.
  const apex: [number, number] = [cx - r * 0.14, cy - r * 0.26];
  const lightX = -0.62;
  const lightY = -0.78;
  ctx.save();
  trace();
  ctx.clip();
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const mx = (a[0] + b[0]) / 2 - apex[0];
    const my = (a[1] + b[1]) / 2 - apex[1];
    const len = Math.hypot(mx, my) || 1;
    const facing = (mx / len) * lightX + (my / len) * lightY;
    const k = Math.max(0, Math.min(1, facing * 0.5 + 0.5));
    const shade = mixHex(tint[2], tint[0], Math.pow(k, 1.9) * 1.05);
    ctx.beginPath();
    ctx.moveTo(apex[0], apex[1]);
    ctx.lineTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.closePath();
    ctx.fillStyle = hexStr(shade);
    ctx.fill();
    ctx.strokeStyle = `rgba(${((tint[2] >> 16) & 255) * 0.6}, ${((tint[2] >> 8) & 255) * 0.6}, ${(tint[2] & 255) * 0.6}, 0.35)`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // Dust collecting in the lower crevices.
  ctx.fillStyle = 'rgba(176,104,58,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.1, cy + r * 0.55, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  speckle(
    ctx,
    cx - r * 1.2,
    cy - r * 1.2,
    r * 2.4,
    r * 2.4,
    Math.floor(r * 2.6),
    ['rgba(255,226,190,0.22)', 'rgba(24,12,6,0.3)'],
    rng,
    1.6,
  );
  ctx.restore();

  // Silhouette edge so rock separates cleanly from the dust.
  trace();
  ctx.strokeStyle = 'rgba(32,16,7,0.55)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Crisp sunlit edge along the top-left rim.
  ctx.save();
  trace();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,222,186,0.5)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x - 1.4, y - 1.6) : ctx.moveTo(x - 1.4, y - 1.6)));
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawCrater(ctx: Ctx, w: number, h: number, seed: number) {
  const rng = makeRng(seed);
  const cx = w / 2;
  const cy = h / 2;
  const rx = w * 0.44;
  const ry = h * 0.4;

  // Ejecta halo.
  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = rGrad(ctx, cx, cy, rx * 0.8, rx * 1.4, [
    [0, 'rgba(206,150,104,0.5)'],
    [1, 'rgba(206,150,104,0)'],
  ]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 1.45, ry * 1.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Outer rim.
  ctx.save();
  blobPath(ctx, cx, cy, rx, makeRng(seed + 11), 16, 0.1, ry / rx);
  ctx.fillStyle = rGrad(
    ctx,
    cx,
    cy,
    rx * 0.2,
    rx,
    [
      [0, 'rgba(120,64,34,0.9)'],
      [0.72, 'rgba(160,92,52,0.85)'],
      [1, 'rgba(214,160,114,0.9)'],
    ],
    cx - rx * 0.3,
    cy - ry * 0.4,
  );
  ctx.fill();
  ctx.restore();

  // Bowl interior with a shadow on the sun-facing side.
  ctx.save();
  blobPath(ctx, cx, cy, rx * 0.76, makeRng(seed + 23), 14, 0.08, ry / rx);
  ctx.clip();
  ctx.fillStyle = rGrad(
    ctx,
    cx,
    cy,
    rx * 0.1,
    rx * 0.9,
    [
      [0, 'rgba(58,28,14,0.92)'],
      [0.6, 'rgba(92,46,24,0.9)'],
      [1, 'rgba(132,72,40,0.85)'],
    ],
    cx + rx * 0.25,
    cy + ry * 0.3,
  );
  ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  ctx.fillStyle = 'rgba(16,8,4,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.22, cy - ry * 0.18, rx * 0.6, ry * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  speckle(ctx, cx - rx, cy - ry, rx * 2, ry * 2, 140, ['rgba(0,0,0,0.35)', 'rgba(220,170,130,0.2)'], rng, 2);
  ctx.restore();

  // Highlight on the far rim.
  ctx.strokeStyle = 'rgba(255,214,170,0.45)';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.88, ry * 0.88, 0, Math.PI * 1.1, Math.PI * 1.85);
  ctx.stroke();

  // Small rocks around the rim.
  for (let i = 0; i < 14; i++) {
    const a = rng() * Math.PI * 2;
    const d = rx * (0.95 + rng() * 0.35);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d * (ry / rx);
    const r = 2 + rng() * 4;
    ctx.fillStyle = 'rgba(42,24,14,0.45)';
    ctx.beginPath();
    ctx.ellipse(x + 1, y + 1.4, r, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(146,92,58,0.95)';
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDune(ctx: Ctx, w: number, h: number, seed: number) {
  const rng = makeRng(seed);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.bezierCurveTo(w * 0.18, h * 0.32, w * 0.42, h * 0.1, w * 0.62, h * 0.24);
  ctx.bezierCurveTo(w * 0.82, h * 0.38, w * 0.92, h * 0.72, w, h);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = vGrad(ctx, 0, 0, h, [
    [0, 'rgba(226,178,128,0.85)'],
    [0.45, 'rgba(188,122,74,0.7)'],
    [1, 'rgba(120,62,32,0.5)'],
  ]);
  ctx.fillRect(0, 0, w, h);

  // Wind ripples.
  ctx.strokeStyle = 'rgba(255,214,170,0.26)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 16; i++) {
    const y = h * 0.2 + rng() * h * 0.8;
    ctx.globalAlpha = 0.18 + rng() * 0.25;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < w; x += 30) {
      ctx.quadraticCurveTo(x + 15, y - 5 - rng() * 4, x + 30, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Crest highlight.
  ctx.strokeStyle = 'rgba(255,226,186,0.5)';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(w * 0.04, h * 0.95);
  ctx.bezierCurveTo(w * 0.2, h * 0.3, w * 0.44, h * 0.08, w * 0.62, h * 0.22);
  ctx.stroke();
}

function drawCracks(ctx: Ctx, size: number, seed: number) {
  const rng = makeRng(seed);
  ctx.strokeStyle = 'rgba(48,24,12,0.45)';
  ctx.lineCap = 'round';
  const branch = (x: number, y: number, angle: number, len: number, width: number, depth: number) => {
    if (depth > 3 || len < 6) return;
    const x2 = x + Math.cos(angle) * len;
    const y2 = y + Math.sin(angle) * len;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    if (rng() > 0.25) branch(x2, y2, angle + (rng() - 0.5) * 1.2, len * 0.72, width * 0.72, depth + 1);
    if (rng() > 0.55) branch(x2, y2, angle + (rng() - 0.5) * 1.6, len * 0.6, width * 0.6, depth + 1);
  };
  for (let i = 0; i < 3; i++) {
    branch(size * rng(), size * rng(), rng() * Math.PI * 2, size * 0.26, 2.6, 0);
  }
}

/* ============================================================
   Distant terrain backdrop
   ============================================================ */
function drawRidgeLayer(
  ctx: Ctx,
  w: number,
  h: number,
  seed: number,
  colors: [string, string],
  roughness: number,
  peak: number,
) {
  const rng = makeRng(seed);
  // Integer harmonics keep the silhouette seamless when the layer tiles.
  const octaves = [
    { f: 1, a: 0.55, p: rng() * Math.PI * 2 },
    { f: 3, a: 0.26, p: rng() * Math.PI * 2 },
    { f: 7, a: 0.12, p: rng() * Math.PI * 2 },
    { f: 13, a: 0.06, p: rng() * Math.PI * 2 },
  ];
  const baseY = h * (1 - peak * 0.55);
  const amplitude = h * peak * 0.62 + roughness;

  const profile = (x: number) => {
    let y = baseY;
    for (const o of octaves) {
      y -= Math.sin((x / w) * Math.PI * 2 * o.f + o.p) * amplitude * o.a;
    }
    return Math.max(h * 0.05, Math.min(h * 0.98, y));
  };

  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, profile(0));
  for (let x = 3; x <= w; x += 3) {
    const prev = profile(x - 3);
    const cur = profile(x);
    ctx.quadraticCurveTo(x - 1.5, (prev + cur) / 2, x, cur);
  }
  ctx.lineTo(w, h);
  ctx.closePath();

  ctx.save();
  ctx.fillStyle = vGrad(ctx, 0, 0, h, [
    [0, colors[0]],
    [0.55, colors[0]],
    [1, colors[1]],
  ]);
  ctx.fill();

  ctx.clip();
  // Sunlit crests and shaded flanks.
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = 'rgba(255,208,162,0.75)';
  for (let x = 0; x <= w; x += 3) {
    const y = profile(x);
    const slope = profile(x + 3) - y;
    if (slope > 0) ctx.fillRect(x, y, 3.2, Math.min(14, 3 + slope * 3.2));
  }
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = 'rgba(20,8,4,0.9)';
  for (let x = 0; x <= w; x += 3) {
    const y = profile(x);
    const slope = profile(x + 3) - y;
    if (slope < 0) ctx.fillRect(x, y, 3.2, Math.min(22, 4 - slope * 4.5));
  }
  ctx.globalAlpha = 1;
  speckle(ctx, 0, 0, w, h, 320, ['rgba(0,0,0,0.16)', 'rgba(255,220,180,0.1)'], rng, 2.2);
  ctx.restore();
}

/* ============================================================
   Public: register every terrain texture
   ============================================================ */
export function createTerrainTextures(scene: Phaser.Scene) {
  canvasTex(scene, 'ground', GROUND_SIZE, GROUND_SIZE, (ctx, w) =>
    drawGroundTile(ctx, w, 1337, [
      [124, 60, 32],
      [173, 95, 52],
      [218, 146, 97],
    ]),
  );

  canvasTex(scene, 'region_canyon', 512, 512, (ctx, w) =>
    drawRegionPatch(ctx, w, 77, 'rgba(146,78,42,0.8)', 'rgba(96,50,28,0.75)', 'striated'),
  );
  canvasTex(scene, 'region_plains', 512, 512, (ctx, w) =>
    drawRegionPatch(ctx, w, 91, 'rgba(216,164,116,0.62)', 'rgba(242,206,164,0.75)', 'ripple'),
  );
  canvasTex(scene, 'region_crater', 512, 512, (ctx, w) =>
    drawRegionPatch(ctx, w, 53, 'rgba(176,100,56,0.5)', 'rgba(132,72,40,0.6)', 'smooth'),
  );
  canvasTex(scene, 'region_ridge', 512, 512, (ctx, w) =>
    drawRegionPatch(ctx, w, 29, 'rgba(150,104,76,0.55)', 'rgba(192,142,106,0.6)', 'striated'),
  );
  canvasTex(scene, 'region_flats', 512, 512, (ctx, w) =>
    drawRegionPatch(ctx, w, 61, 'rgba(192,118,70,0.45)', 'rgba(224,160,106,0.55)', 'smooth'),
  );

  const rockTints: [number, number, number][] = [
    [0xa9754a, 0x6d4226, 0x2b1709],
    [0x96663f, 0x5b351d, 0x241307],
    [0xb98355, 0x78492a, 0x30190b],
  ];
  for (let i = 0; i < 6; i++) {
    const size = i < 2 ? 40 : i < 4 ? 72 : 108;
    canvasTex(scene, `rock_${i}`, size, size, (ctx, w) =>
      drawRock(ctx, w, 200 + i * 37, rockTints[i % rockTints.length]),
    );
  }
  for (let i = 0; i < 3; i++) {
    canvasTex(scene, `boulder_${i}`, 150, 150, (ctx, w) =>
      drawRock(ctx, w, 900 + i * 71, rockTints[i % rockTints.length]),
    );
  }

  for (let i = 0; i < 3; i++) {
    const w = 220 + i * 110;
    canvasTex(scene, `crater_${i}`, w, w * 0.78, (ctx, cw, ch) => drawCrater(ctx, cw, ch, 400 + i * 17));
  }

  for (let i = 0; i < 3; i++) {
    canvasTex(scene, `dune_${i}`, 420, 150, (ctx, w, h) => drawDune(ctx, w, h, 600 + i * 23));
  }

  for (let i = 0; i < 2; i++) {
    canvasTex(scene, `cracks_${i}`, 256, 256, (ctx, w) => drawCracks(ctx, w, 700 + i * 13));
  }

  canvasTex(scene, 'ridge_far', 1600, 300, (ctx, w, h) =>
    drawRidgeLayer(ctx, w, h, 11, ['#6d3a24', '#3a1d12'], 20, 0.55),
  );
  canvasTex(scene, 'ridge_mid', 1600, 260, (ctx, w, h) =>
    drawRidgeLayer(ctx, w, h, 23, ['#7d4328', '#4a2616'], 30, 0.62),
  );
  canvasTex(scene, 'ridge_near', 1600, 220, (ctx, w, h) =>
    drawRidgeLayer(ctx, w, h, 41, ['#8a4d2c', '#3d1f12'], 42, 0.7),
  );

  // Footprint: one boot impression, rotated in world space.
  canvasTex(scene, 'footprint', 20, 26, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(58,30,16,0.42)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.38, w * 0.33, h * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.72, w * 0.27, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(226,180,138,0.22)';
    ctx.beginPath();
    ctx.ellipse(w / 2 - 1, h * 0.34, w * 0.2, h * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Scorch mark for the crash site.
  canvasTex(scene, 'scorch', 420, 320, (ctx, w, h) => {
    const rng = makeRng(321);
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = rGrad(ctx, w / 2, h / 2, 0, w / 2, [
      [0, 'rgba(20,10,6,0.85)'],
      [0.45, 'rgba(38,18,10,0.6)'],
      [0.75, 'rgba(60,28,14,0.3)'],
      [1, 'rgba(60,28,14,0)'],
    ]);
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    speckle(ctx, 0, 0, w, h, 500, ['rgba(0,0,0,0.5)', 'rgba(90,40,20,0.3)'], rng, 3);
    ctx.restore();
  });

  // Wind-swept dust streaks that break up the open plains.
  canvasTex(scene, 'wind_streak', 512, 160, (ctx, w, h) => {
    const rng = makeRng(9091);
    ctx.save();
    for (let i = 0; i < 16; i++) {
      const y = rng() * h;
      const len = w * (0.35 + rng() * 0.6);
      const x = rng() * (w - len);
      const grad = ctx.createLinearGradient(x, 0, x + len, 0);
      grad.addColorStop(0, 'rgba(236,196,154,0)');
      grad.addColorStop(0.45, `rgba(240,204,164,${0.25 + rng() * 0.3})`);
      grad.addColorStop(1, 'rgba(236,196,154,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, len, 1.5 + rng() * 3.5);
    }
    for (let i = 0; i < 8; i++) {
      const y = rng() * h;
      const len = w * (0.3 + rng() * 0.5);
      const x = rng() * (w - len);
      const grad = ctx.createLinearGradient(x, 0, x + len, 0);
      grad.addColorStop(0, 'rgba(96,48,22,0)');
      grad.addColorStop(0.5, `rgba(96,48,22,${0.16 + rng() * 0.2})`);
      grad.addColorStop(1, 'rgba(96,48,22,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, len, 1.5 + rng() * 2.5);
    }
    ctx.restore();
  });

  // Warm Martian daytime sky — butterscotch, brightest at the horizon.
  canvasTex(scene, 'sky_band', 128, 512, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#8d5340');
    sky.addColorStop(0.35, '#b0694c');
    sky.addColorStop(0.68, '#cf8a5e');
    sky.addColorStop(0.88, '#e4ab7c');
    sky.addColorStop(1, '#f0c295');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // High dust veil.
    const veil = ctx.createLinearGradient(0, h * 0.45, 0, h);
    veil.addColorStop(0, 'rgba(255,214,170,0)');
    veil.addColorStop(1, 'rgba(255,224,186,0.35)');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, w, h);

    const rng = makeRng(5);
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = rng() > 0.5 ? '#ffe2c0' : '#7e4634';
      ctx.beginPath();
      ctx.ellipse(rng() * w, rng() * h, w * (0.3 + rng()), h * (0.02 + rng() * 0.05), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  // Soft band that blends the ground plane into the distant hills.
  canvasTex(scene, 'horizon_haze', 256, 192, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(240,196,152,0)');
    g.addColorStop(0.34, 'rgba(238,188,144,0.5)');
    g.addColorStop(0.62, 'rgba(216,150,104,0.34)');
    g.addColorStop(1, 'rgba(196,124,80,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

  // Soft radial glow used for lights, markers and the vision cone.
  canvasTex(scene, 'glow', 256, 256, (ctx, w) => {
    ctx.fillStyle = rGrad(ctx, w / 2, w / 2, 0, w / 2, [
      [0, 'rgba(255,255,255,1)'],
      [0.25, 'rgba(255,255,255,0.55)'],
      [0.55, 'rgba(255,255,255,0.18)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    ctx.fillRect(0, 0, w, w);
  });

  // Hard-edged soft dot for particles.
  canvasTex(scene, 'particle', 32, 32, (ctx, w) => {
    ctx.fillStyle = rGrad(ctx, w / 2, w / 2, 0, w / 2, [
      [0, 'rgba(255,255,255,0.95)'],
      [0.5, 'rgba(255,255,255,0.4)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    ctx.fillRect(0, 0, w, w);
  });

  // Smoke puff.
  canvasTex(scene, 'smoke', 96, 96, (ctx, w) => {
    const rng = makeRng(808);
    ctx.globalAlpha = 0.9;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = rGrad(ctx, w / 2, w / 2, 0, w / 2, [
        [0, `rgba(120,110,105,${0.3 - i * 0.03})`],
        [1, 'rgba(90,80,75,0)'],
      ]);
      ctx.beginPath();
      ctx.ellipse(
        w / 2 + (rng() - 0.5) * 14,
        w / 2 + (rng() - 0.5) * 14,
        w * 0.32,
        w * 0.3,
        rng() * 3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  });

}
