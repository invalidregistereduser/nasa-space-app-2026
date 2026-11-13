import { useEffect, useRef } from 'react';

export interface StarfieldProps {
  /** 0 = parked, 1 = full approach streaking. */
  warp?: number;
  /** Apparent radius of Mars in viewport heights. 0 hides the planet. */
  marsSize?: number;
  /** Planet centre, as a fraction of the viewport. */
  marsX?: number;
  marsY?: number;
  /** Extra brightness during the atmospheric entry. */
  glow?: number;
  shootingStars?: boolean;
  className?: string;
}

interface Star {
  x: number;
  y: number;
  z: number;
  r: number;
  hue: number;
  phase: number;
  speed: number;
}

interface Shooter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  len: number;
}

/** Builds the Mars surface strip once; it is then scrolled to fake rotation. */
function buildMarsSurface(size: number) {
  const canvas = document.createElement('canvas');
  canvas.width = size * 2;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, '#d9a06a');
  g.addColorStop(0.18, '#c8743c');
  g.addColorStop(0.5, '#b4551f');
  g.addColorStop(0.84, '#8e3d14');
  g.addColorStop(1, '#c08a5c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size * 2, size);

  // Darker maria and dust-storm swirls.
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < 70; i++) {
    ctx.globalAlpha = 0.08 + rnd() * 0.22;
    ctx.fillStyle = rnd() > 0.45 ? '#7a3410' : '#e2ad7c';
    ctx.beginPath();
    ctx.ellipse(
      rnd() * size * 2,
      rnd() * size,
      size * (0.04 + rnd() * 0.22),
      size * (0.02 + rnd() * 0.1),
      rnd() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  // Valles Marineris style scar.
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#6d2c0d';
  ctx.lineWidth = size * 0.035;
  ctx.beginPath();
  ctx.moveTo(size * 0.35, size * 0.56);
  ctx.quadraticCurveTo(size * 0.75, size * 0.48, size * 1.15, size * 0.6);
  ctx.stroke();

  // Craters.
  for (let i = 0; i < 90; i++) {
    const x = rnd() * size * 2;
    const y = rnd() * size;
    const r = size * (0.004 + rnd() * 0.02);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#7d3511';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#e6b78a';
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Polar caps.
  ctx.globalAlpha = 0.85;
  const cap = ctx.createLinearGradient(0, 0, 0, size * 0.14);
  cap.addColorStop(0, 'rgba(255,255,255,0.95)');
  cap.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = cap;
  ctx.fillRect(0, 0, size * 2, size * 0.14);
  const cap2 = ctx.createLinearGradient(0, size, 0, size * 0.9);
  cap2.addColorStop(0, 'rgba(255,245,235,0.8)');
  cap2.addColorStop(1, 'rgba(255,245,235,0)');
  ctx.fillStyle = cap2;
  ctx.fillRect(0, size * 0.9, size * 2, size * 0.1);
  ctx.globalAlpha = 1;
  return canvas;
}

export function Starfield({
  warp = 0,
  marsSize = 0,
  marsX = 0.5,
  marsY = 0.45,
  glow = 0,
  shootingStars = true,
  className,
}: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const props = useRef({ warp, marsSize, marsX, marsY, glow, shootingStars });
  props.current = { warp, marsSize, marsX, marsY, glow, shootingStars };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars: Star[] = [];
    let nebula: HTMLCanvasElement | null = null;
    const shooters: Shooter[] = [];
    const surface = buildMarsSurface(360);
    let spin = 0;
    let raf = 0;
    let last = performance.now();

    const makeStars = () => {
      const count = Math.min(620, Math.round((width * height) / 2600));
      stars = Array.from({ length: count }, () => {
        const z = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          r: 0.35 + z * 1.5,
          hue: Math.random(),
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 1.8,
        };
      });
    };

    const makeNebula = () => {
      const c = document.createElement('canvas');
      c.width = Math.max(2, Math.floor(width / 2));
      c.height = Math.max(2, Math.floor(height / 2));
      const nctx = c.getContext('2d')!;
      nctx.fillStyle = '#03050d';
      nctx.fillRect(0, 0, c.width, c.height);
      const clouds: [number, number, number, string][] = [
        [0.22, 0.3, 0.55, 'rgba(38,66,132,0.5)'],
        [0.78, 0.22, 0.45, 'rgba(96,44,120,0.38)'],
        [0.6, 0.78, 0.6, 'rgba(24,78,110,0.34)'],
        [0.12, 0.82, 0.4, 'rgba(120,52,38,0.26)'],
      ];
      clouds.forEach(([cx, cy, r, color]) => {
        const grad = nctx.createRadialGradient(
          cx * c.width,
          cy * c.height,
          0,
          cx * c.width,
          cy * c.height,
          r * Math.max(c.width, c.height),
        );
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(3,5,13,0)');
        nctx.fillStyle = grad;
        nctx.fillRect(0, 0, c.width, c.height);
      });
      // Milky dust band.
      nctx.save();
      nctx.translate(c.width * 0.5, c.height * 0.5);
      nctx.rotate(-0.42);
      const band = nctx.createLinearGradient(0, -c.height * 0.3, 0, c.height * 0.3);
      band.addColorStop(0, 'rgba(255,255,255,0)');
      band.addColorStop(0.5, 'rgba(150,170,220,0.09)');
      band.addColorStop(1, 'rgba(255,255,255,0)');
      nctx.fillStyle = band;
      nctx.fillRect(-c.width, -c.height * 0.3, c.width * 2, c.height * 0.6);
      nctx.restore();
      nebula = c;
    };

    const resize = () => {
      const parent = canvas.parentElement;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent?.clientWidth || window.innerWidth;
      height = parent?.clientHeight || window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars();
      makeNebula();
    };

    const drawMars = (size: number, cx: number, cy: number, extraGlow: number) => {
      const r = size;
      if (r < 1) return;

      // Atmospheric halo.
      const halo = ctx.createRadialGradient(cx, cy, r * 0.92, cx, cy, r * 1.35);
      halo.addColorStop(0, `rgba(226,146,96,${0.34 + extraGlow * 0.4})`);
      halo.addColorStop(0.5, `rgba(180,88,48,${0.14 + extraGlow * 0.3})`);
      halo.addColorStop(1, 'rgba(120,50,30,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.36, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      // Rotating surface.
      const sw = r * 2.6;
      const sh = r * 2.1;
      const offset = (spin % 1) * sw;
      ctx.drawImage(surface, cx - r - offset, cy - sh / 2, sw, sh);
      ctx.drawImage(surface, cx - r - offset + sw, cy - sh / 2, sw, sh);

      // Spherical shading: lit from the upper left.
      const shade = ctx.createRadialGradient(
        cx - r * 0.42,
        cy - r * 0.44,
        r * 0.08,
        cx,
        cy,
        r * 1.08,
      );
      shade.addColorStop(0, 'rgba(255,236,208,0.4)');
      shade.addColorStop(0.26, 'rgba(255,190,140,0)');
      shade.addColorStop(0.52, 'rgba(52,16,6,0.4)');
      shade.addColorStop(0.72, 'rgba(24,7,3,0.78)');
      shade.addColorStop(0.88, 'rgba(8,3,1,0.93)');
      shade.addColorStop(1, 'rgba(2,1,0,0.99)');
      ctx.fillStyle = shade;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

      // Thin bright limb on the lit side.
      ctx.strokeStyle = `rgba(255,206,160,${0.5 + extraGlow * 0.4})`;
      ctx.lineWidth = Math.max(1, r * 0.012);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.995, Math.PI * 0.95, Math.PI * 1.85);
      ctx.stroke();
      ctx.restore();
    };

    const frame = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const p = props.current;
      spin += dt * 0.000018;

      // Background.
      if (nebula) ctx.drawImage(nebula, 0, 0, width, height);
      else {
        ctx.fillStyle = '#03050d';
        ctx.fillRect(0, 0, width, height);
      }

      // Stars.
      const warpAmount = p.warp;
      const cx = width / 2;
      const cy = height / 2;
      for (const star of stars) {
        star.phase += dt * 0.0016 * star.speed;
        const twinkle = 0.55 + Math.sin(star.phase) * 0.45;
        const alpha = (0.25 + star.z * 0.75) * twinkle;

        if (warpAmount > 0.01) {
          const dx = star.x - cx;
          const dy = star.y - cy;
          const push = (0.0009 + star.z * 0.0042) * warpAmount * dt;
          star.x += dx * push;
          star.y += dy * push;
          if (star.x < -40 || star.x > width + 40 || star.y < -40 || star.y > height + 40) {
            star.x = cx + (Math.random() - 0.5) * width * 0.4;
            star.y = cy + (Math.random() - 0.5) * height * 0.4;
          }
          const streak = Math.min(34, warpAmount * star.z * 30);
          if (streak > 1.2) {
            const len = Math.hypot(star.x - cx, star.y - cy) || 1;
            ctx.strokeStyle = `rgba(206,226,255,${alpha * 0.8})`;
            ctx.lineWidth = star.r * 0.9;
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(
              star.x - ((star.x - cx) / len) * streak,
              star.y - ((star.y - cy) / len) * streak,
            );
            ctx.stroke();
            continue;
          }
        } else {
          star.x += dt * 0.0022 * star.z;
          if (star.x > width + 2) star.x = -2;
        }

        const tint =
          star.hue > 0.82
            ? `rgba(255,214,186,${alpha})`
            : star.hue > 0.6
              ? `rgba(198,222,255,${alpha})`
              : `rgba(238,246,255,${alpha})`;
        ctx.fillStyle = tint;
        if (star.r < 0.9) {
          ctx.fillRect(star.x, star.y, star.r * 1.5, star.r * 1.5);
        } else {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
          ctx.fill();
          if (star.z > 0.86) {
            ctx.fillStyle = `rgba(190,220,255,${alpha * 0.22})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r * 3.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Shooting stars.
      if (p.shootingStars && Math.random() < 0.0022 * (dt / 16)) {
        const edge = Math.random();
        shooters.push({
          x: edge * width,
          y: Math.random() * height * 0.5,
          vx: 0.5 + Math.random() * 0.7,
          vy: 0.18 + Math.random() * 0.4,
          life: 1,
          len: 90 + Math.random() * 160,
        });
      }
      for (let i = shooters.length - 1; i >= 0; i--) {
        const s = shooters[i];
        s.x += s.vx * dt * 0.75;
        s.y += s.vy * dt * 0.75;
        s.life -= dt * 0.0012;
        if (s.life <= 0) {
          shooters.splice(i, 1);
          continue;
        }
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * s.len, s.y - s.vy * s.len);
        grad.addColorStop(0, `rgba(255,255,255,${s.life * 0.9})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * s.len, s.y - s.vy * s.len);
        ctx.stroke();
      }

      if (p.marsSize > 0.0001) {
        drawMars(p.marsSize * height, p.marsX * width, p.marsY * height, p.glow);
      }

      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className ?? 'absolute inset-0 h-full w-full'} />;
}
