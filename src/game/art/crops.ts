import type { CropId } from '../../types';
import { canvasTex, makeRng, type Ctx } from './draw';

export const CROP_STAGES = 5;
export const CROP_SPRITE_W = 112;
export const CROP_SPRITE_H = 124;

interface Palette {
  stem: string;
  leafDark: string;
  leafMid: string;
  leafLight: string;
  fruit: string;
  fruitShade: string;
}

const PALETTES: Record<CropId, Palette> = {
  potato: {
    stem: '#4b7a37',
    leafDark: '#3d6b2e',
    leafMid: '#539440',
    leafLight: '#79bd5d',
    fruit: '#cfa468',
    fruitShade: '#9a7240',
  },
  lettuce: {
    stem: '#5c8f3e',
    leafDark: '#3f7a35',
    leafMid: '#5fa94a',
    leafLight: '#94d473',
    fruit: '#b4e08c',
    fruitShade: '#6fae52',
  },
  tomato: {
    stem: '#46762f',
    leafDark: '#376326',
    leafMid: '#4d8b37',
    leafLight: '#71b355',
    fruit: '#e04a33',
    fruitShade: '#a62f1e',
  },
  beans: {
    stem: '#4f8336',
    leafDark: '#3c6d2b',
    leafMid: '#568f3d',
    leafLight: '#7fc45f',
    fruit: '#8fcc62',
    fruitShade: '#5c9138',
  },
  herbs: {
    stem: '#4a8a4c',
    leafDark: '#3c7742',
    leafMid: '#55a259',
    leafLight: '#8ed38c',
    fruit: '#b9e6a8',
    fruitShade: '#6aa65e',
  },
  wheat: {
    stem: '#8f9a42',
    leafDark: '#7d8a38',
    leafMid: '#a3ae4e',
    leafLight: '#c8cf74',
    fruit: '#e3c766',
    fruitShade: '#b3923c',
  },
};

function leaf(
  ctx: Ctx,
  x: number,
  y: number,
  length: number,
  width: number,
  angle: number,
  fill: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(length * 0.4, -width, length, 0);
  ctx.quadraticCurveTo(length * 0.4, width, 0, 0);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,46,16,0.22)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length * 0.92, 0);
  ctx.stroke();
  ctx.restore();
}

function stem(ctx: Ctx, x: number, baseY: number, height: number, lean: number, colour: string, width = 3) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + lean * 0.4, baseY - height * 0.6, x + lean, baseY - height);
  ctx.stroke();
}

/**
 * Draws one crop at one growth stage, standing on the bottom edge of the canvas.
 * Stage 0 is freshly sown seed; stage 4 is ready to pick.
 */
export function drawCropSprite(ctx: Ctx, crop: CropId, stage: number, seed = 1) {
  const p = PALETTES[crop];
  const rng = makeRng(seed * 31 + stage * 7 + crop.length);
  const baseY = CROP_SPRITE_H - 10;
  const cx = CROP_SPRITE_W / 2;

  if (stage === 0) {
    // A few seeds pressed into the medium.
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? '#c8a974' : '#a98656';
      ctx.beginPath();
      ctx.ellipse(cx - 18 + rng() * 36, baseY - 2 - rng() * 4, 2.6, 1.8, rng() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  const t = stage / 4;
  const height = 14 + t * (crop === 'wheat' ? 80 : crop === 'lettuce' ? 34 : 66);
  const ready = stage >= 4;

  // Soft shadow so the plant sits in the bed.
  ctx.fillStyle = 'rgba(28,16,8,0.24)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 2, 20 + t * 14, 5 + t * 3, 0, 0, Math.PI * 2);
  ctx.fill();

  if (crop === 'lettuce') {
    const layers = Math.max(1, Math.round(t * 5));
    for (let l = layers; l >= 1; l--) {
      const r = (height / layers) * l * 1.5;
      ctx.fillStyle = l % 2 ? p.leafMid : p.leafDark;
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        const wobble = 1 + Math.sin(a * 4 + l) * 0.16;
        ctx.lineTo(cx + Math.cos(a) * r * wobble, baseY - l * 3 - Math.sin(a) * r * 0.5 * wobble);
      }
      ctx.closePath();
      ctx.fill();
    }
    if (ready) {
      ctx.fillStyle = p.leafLight;
      ctx.beginPath();
      ctx.ellipse(cx, baseY - height * 0.42, height * 0.5, height * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (crop === 'wheat') {
    const stalks = 5 + Math.round(t * 3);
    for (let i = 0; i < stalks; i++) {
      const x = cx - 22 + (i / (stalks - 1)) * 44;
      const h = height * (0.78 + rng() * 0.34);
      const lean = (rng() - 0.5) * 10;
      stem(ctx, x, baseY, h, lean, p.stem, 2);
      if (stage >= 3) {
        const headH = h * 0.3;
        ctx.fillStyle = ready ? p.fruit : p.leafLight;
        for (let k = 0; k < 5; k++) {
          const ky = baseY - h + (headH * k) / 5;
          ctx.beginPath();
          ctx.ellipse(x + lean + (k % 2 ? 2 : -2), ky, 2.2, 3.6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    return;
  }

  // Bushy crops: potato, tomato, beans, herbs.
  const stalks = crop === 'herbs' ? 6 : crop === 'tomato' ? 2 : 3;
  for (let i = 0; i < stalks; i++) {
    const spread = crop === 'herbs' ? 40 : 30;
    const offset = (i / Math.max(1, stalks - 1) - 0.5) * spread;
    const h = height * (0.82 + rng() * 0.3);
    const lean = offset * 0.35 + (rng() - 0.5) * 6;
    const x = cx + offset;
    stem(ctx, x, baseY, h, lean, p.stem, crop === 'herbs' ? 2 : 3);

    const leaves = Math.max(2, Math.round(t * (crop === 'herbs' ? 5 : 6)));
    for (let l = 0; l < leaves; l++) {
      const ly = baseY - (h * (l + 1)) / (leaves + 0.5);
      const lx = x + lean * ((l + 1) / leaves) * 0.7;
      const size = (crop === 'herbs' ? 7 : 12) + t * 8;
      const shade = l % 2 ? p.leafMid : p.leafDark;
      leaf(ctx, lx, ly, size, size * 0.45, -0.5 - rng() * 0.3, shade);
      leaf(ctx, lx, ly, size, size * 0.45, Math.PI + 0.5 + rng() * 0.3, l % 2 ? p.leafLight : p.leafMid);
    }
  }

  if (ready) {
    if (crop === 'potato') {
      for (let i = 0; i < 3; i++) {
        const x = cx - 20 + rng() * 40;
        ctx.fillStyle = p.fruit;
        ctx.beginPath();
        ctx.ellipse(x, baseY - 3, 7, 5, rng(), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.fruitShade;
        ctx.beginPath();
        ctx.ellipse(x + 1.5, baseY - 1.5, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#eae4f2';
      for (let f = 0; f < 3; f++) {
        ctx.beginPath();
        ctx.arc(cx - 8 + f * 8, baseY - height - 2, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (crop === 'tomato') {
      for (let i = 0; i < 5; i++) {
        const x = cx - 16 + rng() * 32;
        const y = baseY - height * (0.3 + rng() * 0.5);
        ctx.fillStyle = p.fruitShade;
        ctx.beginPath();
        ctx.arc(x + 1, y + 1, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.fruit;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,220,200,0.6)';
        ctx.beginPath();
        ctx.arc(x - 2, y - 2.2, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (crop === 'beans') {
      for (let i = 0; i < 6; i++) {
        const x = cx - 18 + rng() * 36;
        const y = baseY - height * (0.25 + rng() * 0.45);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(0.5 + rng() * 0.6);
        ctx.fillStyle = p.fruit;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.fruitShade;
        ctx.beginPath();
        ctx.ellipse(0, 1.2, 9, 1.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (crop === 'herbs') {
      ctx.fillStyle = p.fruit;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.arc(cx - 20 + rng() * 40, baseY - height * (0.4 + rng() * 0.6), 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

const CROP_LIST: CropId[] = ['potato', 'lettuce', 'tomato', 'beans', 'herbs', 'wheat'];

/** Registers `crop_<id>_<stage>` textures for the greenhouse interior. */
export function createCropTextures(scene: Phaser.Scene) {
  CROP_LIST.forEach((crop, ci) => {
    for (let stage = 0; stage < CROP_STAGES; stage++) {
      canvasTex(scene, `crop_${crop}_${stage}`, CROP_SPRITE_W, CROP_SPRITE_H, (ctx) => {
        drawCropSprite(ctx, crop, stage, ci * 13 + 5);
      });
    }
  });
}

/** Maps growth percentage onto one of the five visible stages. */
export function stageForGrowth(growth: number, ready: boolean) {
  if (ready || growth >= 100) return 4;
  if (growth >= 62) return 3;
  if (growth >= 28) return 2;
  if (growth >= 6) return 1;
  return 0;
}
