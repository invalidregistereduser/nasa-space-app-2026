import { useEffect, useRef } from 'react';
import type { CropId } from '../../types';

interface Props {
  crop: CropId | null;
  /** 0-100 */
  growth: number;
  /** 0-100 */
  health?: number;
  /** 0-100 — drives the lamp glow. */
  light?: number;
  seed?: number;
  width?: number;
  height?: number;
  className?: string;
}

function rand(seed: number) {
  let a = seed * 9301 + 49297;
  return () => {
    a = (a * 9301 + 49297) % 233280;
    return a / 233280;
  };
}

/** Draws one planting tray and the crop growing in it. */
export function PlantArt({
  crop,
  growth,
  health = 100,
  light = 70,
  seed = 1,
  width = 150,
  height = 110,
  className,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({ crop, growth, health, light, seed });
  state.current = { crop, growth, health, light, seed };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const s = state.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const soilTop = height * 0.66;
      const trayH = height * 0.26;

      // Lamp glow from above — a soft cone rather than a flat wash.
      if (s.light > 0) {
        const strength = (s.light / 100) * 0.3;
        const lamp = ctx.createRadialGradient(
          width / 2,
          -height * 0.25,
          height * 0.06,
          width / 2,
          -height * 0.25,
          height * 1.15,
        );
        lamp.addColorStop(0, `rgba(198,255,220,${strength})`);
        lamp.addColorStop(0.55, `rgba(170,245,205,${strength * 0.45})`);
        lamp.addColorStop(1, 'rgba(170,245,205,0)');
        ctx.fillStyle = lamp;
        ctx.fillRect(0, 0, width, soilTop + 12);

        // Lamp bar at the very top.
        ctx.fillStyle = `rgba(214,255,228,${0.25 + (s.light / 100) * 0.5})`;
        ctx.fillRect(width * 0.3, 2, width * 0.4, 2.5);
      }

      // Tray.
      const trayX = width * 0.12;
      const trayW = width * 0.76;
      const grad = ctx.createLinearGradient(0, soilTop, 0, soilTop + trayH);
      grad.addColorStop(0, '#9aa6b6');
      grad.addColorStop(0.3, '#6f7b8c');
      grad.addColorStop(1, '#39414e');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(trayX, soilTop, trayW, trayH, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,216,236,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Growth medium.
      ctx.fillStyle = '#4a3122';
      ctx.beginPath();
      ctx.roundRect(trayX + 4, soilTop + 3, trayW - 8, trayH * 0.45, 3);
      ctx.fill();
      const soilRng = rand(s.seed * 31 + 5);
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = soilRng() > 0.5 ? 'rgba(96,64,44,0.9)' : 'rgba(30,18,12,0.8)';
        ctx.fillRect(
          trayX + 5 + soilRng() * (trayW - 12),
          soilTop + 4 + soilRng() * (trayH * 0.4),
          1.8,
          1.8,
        );
      }

      if (s.crop) {
        drawCrop(ctx, s.crop, s.growth / 100, s.health / 100, trayX + trayW / 2, soilTop + 4, trayW, height, t, s.seed);
      } else {
        ctx.fillStyle = 'rgba(160,180,200,0.35)';
        ctx.font = '600 9px "Rajdhani", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('EMPTY TRAY', trayX + trayW / 2, soilTop - 8);
        ctx.textAlign = 'left';
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [width, height]);

  return <canvas ref={ref} className={className} />;
}

function drawCrop(
  ctx: CanvasRenderingContext2D,
  crop: CropId,
  g: number,
  health: number,
  cx: number,
  baseY: number,
  trayW: number,
  height: number,
  t: number,
  seed: number,
) {
  const sway = Math.sin(t * 1.1 + seed) * 0.035;
  const vigour = 0.55 + health * 0.45;
  const maxH = height * 0.52 * vigour;

  if (g < 0.04) {
    // Freshly sown seeds.
    const rng = rand(seed);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = '#c7a06a';
      ctx.beginPath();
      ctx.ellipse(cx - trayW * 0.3 + rng() * trayW * 0.6, baseY + 4, 2.4, 1.6, rng(), 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  const stems = crop === 'wheat' ? 7 : crop === 'lettuce' ? 1 : 3;
  for (let i = 0; i < stems; i++) {
    const offset = stems === 1 ? 0 : (i / (stems - 1) - 0.5) * trayW * 0.55;
    const h = maxH * g * (0.8 + ((i * 37) % 10) / 25);
    const x = cx + offset;
    const lean = sway * (60 + i * 12);

    ctx.save();
    ctx.translate(x, baseY);

    if (crop === 'lettuce') {
      // Rosette of ruffled leaves.
      const layers = Math.max(1, Math.round(g * 5));
      for (let l = layers; l >= 1; l--) {
        const r = (h / layers) * l * 1.25;
        const hue = 118 - l * 6;
        ctx.fillStyle = `hsl(${hue} ${48 + l * 4}% ${26 + l * 7}%)`;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 7) {
          const wobble = 1 + Math.sin(a * 4 + t + l) * 0.14;
          ctx.lineTo(Math.cos(a) * r * wobble * 1.15, -Math.sin(a) * r * wobble * 0.52 - l * 1.4);
        }
        ctx.closePath();
        ctx.fill();
      }
      if (g > 0.92) {
        ctx.strokeStyle = 'rgba(255,170,190,0.55)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, -h * 0.5, h * 0.55, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (crop === 'wheat') {
      ctx.strokeStyle = `hsl(${74 - g * 24} ${40 + g * 20}% ${34 + g * 22}%)`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(lean * 0.5, -h * 0.6, lean, -h);
      ctx.stroke();
      if (g > 0.55) {
        // Grain head.
        const headH = h * 0.3 * ((g - 0.55) / 0.45);
        ctx.fillStyle = `hsl(${46 - (1 - g) * 10} 62% ${52 + g * 12}%)`;
        for (let k = 0; k < 5; k++) {
          const ky = -h + headH * (k / 5);
          ctx.beginPath();
          ctx.ellipse(lean + (k % 2 ? 1.8 : -1.8), ky, 2, 3.2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // Potato: leafy bush with tubers appearing at maturity.
      ctx.strokeStyle = `hsl(${120 - g * 14} 42% ${28 + g * 14}%)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(lean * 0.4, -h * 0.55, lean, -h);
      ctx.stroke();

      const leaves = Math.max(2, Math.round(g * 6));
      for (let l = 0; l < leaves; l++) {
        const ly = -(h * (l + 1)) / (leaves + 0.6);
        const lx = lean * ((l + 1) / leaves) * 0.6;
        const size = 3.4 + g * 4.2;
        [-1, 1].forEach((side) => {
          ctx.fillStyle = `hsl(${124 - l * 5} ${44 + g * 14}% ${30 + l * 4 + g * 10}%)`;
          ctx.beginPath();
          ctx.ellipse(lx + side * size * 0.95, ly, size, size * 0.56, side * 0.5 + sway, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      if (g > 0.9 && i === 1) {
        ctx.fillStyle = '#e8e2ef';
        for (let f = 0; f < 3; f++) {
          ctx.beginPath();
          ctx.arc(lean + (f - 1) * 5, -h - 2, 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  // Mature tubers peeking from the medium.
  if (crop === 'potato' && g > 0.82) {
    const rng = rand(seed + 9);
    for (let i = 0; i < 3; i++) {
      const x = cx - trayW * 0.26 + rng() * trayW * 0.52;
      ctx.fillStyle = '#c9a06a';
      ctx.beginPath();
      ctx.ellipse(x, baseY + 7, 5.2, 3.6, rng(), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(90,60,34,0.5)';
      ctx.beginPath();
      ctx.ellipse(x + 1, baseY + 8, 2, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (g >= 1) {
    ctx.save();
    const glow = ctx.createRadialGradient(cx, baseY - maxH * 0.4, 2, cx, baseY - maxH * 0.4, maxH);
    glow.addColorStop(0, 'rgba(140,255,180,0.22)');
    glow.addColorStop(1, 'rgba(140,255,180,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - maxH, baseY - maxH * 1.4, maxH * 2, maxH * 1.6);
    ctx.restore();
  }
}
