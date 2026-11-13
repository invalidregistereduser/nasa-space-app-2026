import { useEffect, useRef } from 'react';
import { FOG_COLS, FOG_ROWS, LOCATIONS, PICKUPS, WORLD } from '../../game/constants';
import { isRevealed } from '../../state/fog';
import { live, useLive } from '../../state/live';
import { useGame } from '../../state/store';

const SIZE = 148;
/** World pixels visible across the minimap. */
const SPAN = 2600;

/** Corner minimap: nearby terrain, the astronaut and the way to the objective. */
export function Minimap() {
  const state = useGame();
  const liveData = useLive(8);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scale = SIZE / SPAN;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const toScreen = (wx: number, wy: number) => ({
      x: cx + (wx - live.x) * scale,
      y: cy + (wy - live.y) * scale,
    });

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Base: uncharted hatch.
    ctx.fillStyle = '#131b27';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.strokeStyle = 'rgba(126,164,196,0.12)';
    ctx.lineWidth = 1;
    for (let i = -2; i < 10; i++) {
      ctx.beginPath();
      for (let x = 0; x <= SIZE; x += 6) {
        const y = i * 17 + Math.sin((x + i * 29) / 18) * 4;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Surveyed ground around the player.
    const cell = WORLD.fogCell * scale;
    const c0 = Math.max(0, Math.floor((live.x - SPAN / 2) / WORLD.fogCell));
    const c1 = Math.min(FOG_COLS - 1, Math.ceil((live.x + SPAN / 2) / WORLD.fogCell));
    const r0 = Math.max(0, Math.floor((live.y - SPAN / 2) / WORLD.fogCell));
    const r1 = Math.min(FOG_ROWS - 1, Math.ceil((live.y + SPAN / 2) / WORLD.fogCell));
    ctx.fillStyle = 'rgba(158,92,54,0.95)';
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (!isRevealed(c, r)) continue;
        const p = toScreen(c * WORLD.fogCell, r * WORLD.fogCell);
        ctx.fillRect(p.x, p.y, cell + 1, cell + 1);
      }
    }

    // Named sites.
    LOCATIONS.forEach((loc) => {
      if (!state.discovered[loc.id]) return;
      const p = toScreen(loc.x, loc.y);
      if (p.x < -20 || p.x > SIZE + 20 || p.y < -20 || p.y > SIZE + 20) return;
      ctx.fillStyle = `#${loc.tint.toString(16).padStart(6, '0')}`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    PICKUPS.forEach((pickup) => {
      if (state.collected[pickup.id]) return;
      const known = state.flags.roverSurveyed
        ? pickup.surveyed !== false
        : state.discovered[pickup.locationId];
      if (!known) return;
      const p = toScreen(pickup.x, pickup.y);
      if (p.x < 0 || p.x > SIZE || p.y < 0 || p.y > SIZE) return;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = 'rgba(56,220,248,0.9)';
      ctx.fillRect(-2, -2, 4, 4);
      ctx.restore();
    });

    // Objective, clamped to the rim when it is further than the minimap reaches.
    const wp = liveData.waypoint;
    if (wp) {
      const p = toScreen(wp.x, wp.y);
      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.hypot(dx, dy);
      const limit = SIZE / 2 - 10;
      const clamped = dist > limit ? { x: cx + (dx / dist) * limit, y: cy + (dy / dist) * limit } : p;
      const pulse = 0.6 + Math.sin(Date.now() / 260) * 0.4;
      ctx.fillStyle = `rgba(56,220,248,${pulse})`;
      ctx.beginPath();
      ctx.arc(clamped.x, clamped.y, dist > limit ? 4.5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
      if (dist > limit) {
        ctx.strokeStyle = 'rgba(56,220,248,0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(clamped.x, clamped.y, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // The astronaut, always dead centre.
    const angle =
      live.facing === 'up'
        ? -Math.PI / 2
        : live.facing === 'down'
          ? Math.PI / 2
          : live.facing === 'left'
            ? Math.PI
            : 0;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-4, -4.5);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-4, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, [state, liveData]);

  return (
    <div className="panel panel-tight pointer-events-auto relative overflow-hidden p-1.5">
      <canvas
        ref={canvasRef}
        style={{ width: SIZE, height: SIZE }}
        className="rounded-md"
      />
      <div className="pointer-events-none absolute inset-1.5 rounded-md scanlines" />
      <span className="label absolute bottom-2.5 left-1/2 -translate-x-1/2 text-[8px] text-nav-200/70">
        local survey
      </span>
    </div>
  );
}
