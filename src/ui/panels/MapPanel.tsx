import { useEffect, useRef } from 'react';
import { PanelShell } from '../components/PanelShell';
import {
  BUILD_SITES,
  FOG_COLS,
  FOG_ROWS,
  LOCATIONS,
  PICKUPS,
  STRUCTURES,
  WORLD,
} from '../../game/constants';
import { exploredFraction, fogGrid } from '../../state/fog';
import { closePanel, useGame } from '../../state/store';
import { live, useLive } from '../../state/live';

/** Muted terrain colours per region — the map reads as ground, not as markers. */
const MAP_TERRAIN: Record<string, [number, number, number]> = {
  crash_site: [152, 82, 50],
  shelter: [146, 96, 68],
  build_flats: [172, 112, 66],
  rover_station: [138, 88, 58],
  crater_field: [160, 98, 58],
  rocky_canyon: [120, 66, 38],
  dust_plains: [198, 152, 106],
  distant_ridge: [126, 98, 82],
};

function buildTerrainColours() {
  const colours = new Uint8ClampedArray(FOG_COLS * FOG_ROWS * 4);
  for (let r = 0; r < FOG_ROWS; r++) {
    for (let c = 0; c < FOG_COLS; c++) {
      const x = c * WORLD.fogCell + WORLD.fogCell / 2;
      const y = r * WORLD.fogCell + WORLD.fogCell / 2;
      let rr = 134;
      let gg = 78;
      let bb = 46;

      let nearest = Infinity;
      let tint: [number, number, number] | null = null;
      for (const loc of LOCATIONS) {
        const d = Math.hypot(loc.x - x, loc.y - y);
        if (d < loc.radius && d < nearest) {
          nearest = d;
          tint = MAP_TERRAIN[loc.id] ?? null;
        }
      }
      if (tint) {
        const t = 0.62;
        rr = Math.round(rr * (1 - t) + tint[0] * t);
        gg = Math.round(gg * (1 - t) + tint[1] * t);
        bb = Math.round(bb * (1 - t) + tint[2] * t);
      }
      const n = ((c * 7 + r * 13) % 11) - 5;
      const i = (r * FOG_COLS + c) * 4;
      colours[i] = Math.max(0, rr + n * 2);
      colours[i + 1] = Math.max(0, gg + n * 1.5);
      colours[i + 2] = Math.max(0, bb + n);
      colours[i + 3] = 255;
    }
  }
  return colours;
}

/** Soft contour hatching that stands in for terrain nobody has surveyed yet. */
function buildUnchartedPattern() {
  const tile = document.createElement('canvas');
  tile.width = 160;
  tile.height = 160;
  const ctx = tile.getContext('2d')!;
  ctx.fillStyle = '#17202e';
  ctx.fillRect(0, 0, 160, 160);
  ctx.strokeStyle = 'rgba(126,164,196,0.17)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    for (let x = -10; x <= 170; x += 6) {
      const y = i * 19 + Math.sin((x + i * 37) / 26) * 6 + Math.sin(x / 11) * 2;
      if (x === -10) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(126,164,196,0.1)';
  for (let i = 0; i < 24; i++) {
    ctx.fillRect((i * 53) % 160, (i * 31) % 160, 1.4, 1.4);
  }
  return ctx.createPattern(tile, 'repeat')!;
}

export function MapPanel() {
  const state = useGame();
  const liveData = useLive(5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const terrain = useRef<Uint8ClampedArray | null>(null);

  useEffect(() => {
    if (!terrain.current) terrain.current = buildTerrainColours();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fogBuffer = document.createElement('canvas');
    fogBuffer.width = FOG_COLS;
    fogBuffer.height = FOG_ROWS;
    const fogCtx = fogBuffer.getContext('2d')!;
    const image = fogCtx.createImageData(FOG_COLS, FOG_ROWS);
    const uncharted = buildUnchartedPattern();

    let raf = 0;
    const render = () => {
      const parent = canvas.parentElement;
      const maxHeight = Math.max(240, Math.min(430, window.innerHeight * 0.46));
      let cssW = parent?.clientWidth ?? 720;
      let cssH = Math.round((cssW * WORLD.height) / WORLD.width);
      if (cssH > maxHeight) {
        cssH = Math.round(maxHeight);
        cssW = Math.round((cssH * WORLD.width) / WORLD.height);
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== cssW * dpr) {
        canvas.width = cssW * dpr;
        canvas.height = cssH * dpr;
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sx = cssW / WORLD.width;
      const sy = cssH / WORLD.height;

      // Unsurveyed ground: stylised contour hatching, never a black void.
      ctx.fillStyle = uncharted;
      ctx.fillRect(0, 0, cssW, cssH);

      // Surveyed ground painted over the top.
      const grid = fogGrid();
      const colours = terrain.current!;
      for (let i = 0; i < grid.length; i++) {
        const o = i * 4;
        image.data[o] = colours[o];
        image.data[o + 1] = colours[o + 1];
        image.data[o + 2] = colours[o + 2];
        image.data[o + 3] = grid[i] ? 255 : 0;
      }
      fogCtx.putImageData(image, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(fogBuffer, 0, 0, cssW, cssH);

      ctx.strokeStyle = 'rgba(56,220,248,0.07)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx <= 8; gx++) {
        ctx.beginPath();
        ctx.moveTo((cssW / 8) * gx, 0);
        ctx.lineTo((cssW / 8) * gx, cssH);
        ctx.stroke();
      }
      for (let gy = 0; gy <= 5; gy++) {
        ctx.beginPath();
        ctx.moveTo(0, (cssH / 5) * gy);
        ctx.lineTo(cssW, (cssH / 5) * gy);
        ctx.stroke();
      }

      const dot = (x: number, y: number, colour: string, radius: number, ring = false) => {
        ctx.fillStyle = colour;
        ctx.beginPath();
        ctx.arc(x * sx, y * sy, radius, 0, Math.PI * 2);
        ctx.fill();
        if (ring) {
          ctx.strokeStyle = colour;
          ctx.lineWidth = 1.4;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.arc(x * sx, y * sy, radius + 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      };

      LOCATIONS.forEach((loc) => {
        if (!state.discovered[loc.id]) return;
        const x = loc.x * sx;
        const y = loc.y * sy;
        const wpt = liveData.waypoint;
        const hot = !!wpt && Math.hypot(wpt.x - loc.x, wpt.y - loc.y) < loc.radius;
        ctx.strokeStyle = `rgba(${(loc.tint >> 16) & 255},${(loc.tint >> 8) & 255},${loc.tint & 255},${hot ? 0.7 : 0.32})`;
        ctx.lineWidth = hot ? 2 : 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(x, y, loc.radius * sx, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = hot ? '#ffffff' : '#e9f4ff';
        ctx.font = '600 10px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(loc.name.toUpperCase(), x, y - 10);
        ctx.textAlign = 'left';
        dot(loc.x, loc.y, `#${loc.tint.toString(16).padStart(6, '0')}`, hot ? 4.5 : 3.4, hot);
      });

      PICKUPS.forEach((p) => {
        if (state.collected[p.id]) return;
        const known = state.flags.roverSurveyed
          ? p.surveyed !== false
          : state.discovered[p.locationId];
        if (!known) return;
        ctx.save();
        ctx.translate(p.x * sx, p.y * sy);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = 'rgba(56,220,248,0.9)';
        ctx.fillRect(-3.2, -3.2, 6.4, 6.4);
        ctx.restore();
      });

      BUILD_SITES.forEach((site) => {
        if (!state.discovered.build_flats) return;
        const active = state.greenhouse.siteId === site.id;
        if (state.greenhouse.built && !active) return;
        dot(site.x, site.y, active ? '#76dc92' : 'rgba(118,220,146,0.45)', active ? 4 : 2.6, active);
      });

      if (state.discovered.shelter) dot(STRUCTURES.shelter.x, STRUCTURES.shelter.y, '#38dcf8', 4, true);
      if (state.discovered.crash_site) dot(STRUCTURES.ship.x, STRUCTURES.ship.y, '#ff7a4a', 4, true);

      const wp = liveData.waypoint;
      if (wp) {
        const x = wp.x * sx;
        const y = wp.y * sy;
        const pulse = (Date.now() % 1600) / 1600;
        ctx.strokeStyle = `rgba(56,220,248,${1 - pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 4 + pulse * 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#38dcf8';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      const px = live.x * sx;
      const py = live.y * sy;
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.arc(px, py, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
      const dirAngle =
        live.facing === 'up'
          ? -Math.PI / 2
          : live.facing === 'down'
            ? Math.PI / 2
            : live.facing === 'left'
              ? Math.PI
              : 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(dirAngle) * 11, py + Math.sin(dirAngle) * 11);
      ctx.stroke();

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [state, liveData]);

  const explored = Math.round(exploredFraction() * 100);

  return (
    <PanelShell
      title="Surface map"
      subtitle={`${explored}% of the surface walked`}
      icon="map"
      size="lg"
      onClose={closePanel}
      footer={
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-400">
          <Legend colour="#ffffff" label="You" />
          <Legend colour="#38dcf8" label="Where to go next" />
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-slate-500/60 bg-[#17202e]" />
            Not walked yet
          </span>
        </div>
      }
    >
      <div className="relative mx-auto flex justify-center overflow-hidden rounded-xl border border-nav-400/20 bg-space-950">
        <canvas ref={canvasRef} className="block" />
        <div className="pointer-events-none absolute inset-0 scanlines rounded-xl" />
      </div>

    </PanelShell>
  );
}

function Legend({ colour, label, square }: { colour: string; label: string; square?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={square ? 'h-2.5 w-2.5 rotate-45' : 'h-2.5 w-2.5 rounded-full'}
        style={{ background: colour }}
      />
      {label}
    </span>
  );
}
