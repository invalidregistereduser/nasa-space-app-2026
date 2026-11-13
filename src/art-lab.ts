/**
 * Development-only preview of every procedurally generated texture.
 * Visit /art-lab.html while `npm run dev` is running.
 */
import { createAllTextures, drawAstronautPose, FRAME_H, FRAME_W } from './game/art';

const canvases = new Map<string, HTMLCanvasElement>();
const dirsList = ['down', 'left', 'right', 'up'] as const;

const fakeScene = {
  textures: {
    exists: (key: string) => canvases.has(key),
    get: (key: string) => canvases.get(key),
    createCanvas: (key: string, w: number, h: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvases.set(key, canvas);
      return {
        getContext: () => canvas.getContext('2d')!,
        refresh: () => {},
        add: () => {},
        getSourceImage: () => canvas,
      };
    },
  },
} as unknown as Phaser.Scene;

console.time('texture generation');
createAllTextures(fakeScene);
console.timeEnd('texture generation');

const out = document.getElementById('out')!;

/* --- Zoomed astronaut poses -------------------------------------------- */
if (!location.hash || location.hash === '#astronaut') {
  const section = document.createElement('section');
  const heading = document.createElement('h2');
  heading.textContent = 'Astronaut — 3x';
  section.appendChild(heading);
  const row = document.createElement('div');
  row.className = 'row';
  const poses: [typeof dirsList[number], number][] = [
    ['down', 0], ['down', 3], ['down', 5], ['right', 0], ['right', 3],
    ['right', 5], ['up', 0], ['up', 3], ['left', 3],
  ];
  (['male', 'female'] as const).forEach((kind) => {
    poses.forEach(([dir, col]) => {
      const canvas = document.createElement('canvas');
      const scale = 3;
      canvas.width = FRAME_W * scale;
      canvas.height = FRAME_H * scale;
      canvas.className = 'dark';
      drawAstronautPose(canvas.getContext('2d')!, kind, dir, col, scale);
      const figure = document.createElement('figure');
      figure.appendChild(canvas);
      const cap = document.createElement('figcaption');
      cap.textContent = `${kind} ${dir} ${col}`;
      figure.appendChild(cap);
      row.appendChild(figure);
    });
  });
  section.appendChild(row);
  out.appendChild(section);
}

/* --- Tiled ground check ------------------------------------------------- */
if (!location.hash || location.hash === '#ground') {
  const section = document.createElement('section');
  const heading = document.createElement('h2');
  heading.textContent = 'Ground tiling 3x3 + region overlay';
  section.appendChild(heading);
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const ground = canvases.get('ground')!;
  const pattern = ctx.createPattern(ground, 'repeat')!;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(canvases.get('region_plains')!, 40, -40, 420, 420);
  ctx.drawImage(canvases.get('region_canyon')!, 380, 120, 400, 400);
  ctx.drawImage(canvases.get('crater_1')!, 120, 190, 330, 257);
  ctx.drawImage(canvases.get('dune_0')!, 430, 40, 420, 150);
  ctx.drawImage(canvases.get('rock_4')!, 300, 330, 108, 108);
  ctx.drawImage(canvases.get('rock_2')!, 240, 150, 72, 72);
  ctx.drawImage(canvases.get('boulder_1')!, 560, 300, 150, 150);
  const figure = document.createElement('figure');
  figure.appendChild(canvas);
  section.appendChild(figure);
  out.appendChild(section);
}
const groups: [string, (key: string) => boolean][] = [
  ['Astronauts', (k) => k.startsWith('astro')],
  ['Terrain', (k) => /^(ground|region|rock|boulder|crater|dune|cracks|ridge|footprint|scorch)/.test(k)],
  ['Structures', (k) => /^prop_(ship|shelter|rover|greenhouse|transmitter)/.test(k)],
  ['Collectables', (k) => k.startsWith('prop_') && !/^prop_(ship|shelter|rover|greenhouse|transmitter)/.test(k)],
  ['Markers & FX', (k) => /^(marker|site_pad|glow|particle|smoke|star|debris)/.test(k)],
  ['Greenhouse', (k) => k.startsWith('gh_')],
  ['Crops', (k) => k.startsWith('crop_')],
  ['Truck', (k) => k === 'truck'],
];

const filter = location.hash.replace('#', '').toLowerCase();
for (const [title, match] of groups) {
  if (filter && !title.toLowerCase().includes(filter)) continue;
  const section = document.createElement('section');
  const heading = document.createElement('h2');
  heading.textContent = title;
  section.appendChild(heading);
  const row = document.createElement('div');
  row.className = 'row';
  for (const [key, canvas] of canvases) {
    if (!match(key)) continue;
    const figure = document.createElement('figure');
    canvas.className = title === 'Markers & FX' || title === 'Astronauts' ? 'dark' : '';
    figure.appendChild(canvas);
    const caption = document.createElement('figcaption');
    caption.textContent = `${key} · ${canvas.width}×${canvas.height}`;
    figure.appendChild(caption);
    row.appendChild(figure);
  }
  section.appendChild(row);
  out.appendChild(section);
}
