import { useLive } from '../../state/live';
import { useGame } from '../../state/store';
import { Icon } from '../components/Icon';

const MARGIN = 86;

/**
 * Guidance marker. On-screen targets get a pulsing ring; anything off-screen is
 * pinned to the edge of the view with an arrow and the remaining distance.
 */
export function WaypointArrow() {
  const state = useGame();
  const live = useLive(20);
  const waypoint = live.waypoint;
  if (!waypoint || !state.settings.showWaypointArrow || state.ui.panel !== 'none') return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const onScreen =
    waypoint.screenX > MARGIN &&
    waypoint.screenX < vw - MARGIN &&
    waypoint.screenY > MARGIN &&
    waypoint.screenY < vh - MARGIN;

  if (onScreen) {
    return (
      <div
        className="pointer-events-none absolute z-10"
        style={{ left: waypoint.screenX, top: waypoint.screenY, transform: 'translate(-50%,-50%)' }}
      >
        <div className="relative grid h-14 w-14 place-items-center">
          <span className="absolute inset-0 rounded-full border border-nav-300/70" />
          <span className="absolute inset-0 animate-pulse-ring rounded-full border border-nav-300/60" />
          <span className="h-1.5 w-1.5 rounded-full bg-nav-200" />
        </div>
        <p className="readout mt-1 whitespace-nowrap text-center text-[10px] text-nav-200 drop-shadow">
          {waypoint.distance} m
        </p>
      </div>
    );
  }

  const cx = vw / 2;
  const cy = vh / 2;
  const dx = waypoint.screenX - cx;
  const dy = waypoint.screenY - cy;
  const angle = Math.atan2(dy, dx);
  const halfW = vw / 2 - MARGIN;
  const halfH = vh / 2 - MARGIN;
  const scale = Math.min(halfW / Math.abs(dx || 0.001), halfH / Math.abs(dy || 0.001));
  const x = cx + dx * scale;
  const y = cy + dy * scale;

  return (
    <div
      className="pointer-events-none absolute z-10 flex flex-col items-center"
      style={{ left: x, top: y, transform: 'translate(-50%,-50%)' }}
    >
      <div
        className="grid h-11 w-11 place-items-center rounded-full border border-nav-300/60 bg-space-900/70 text-nav-200 backdrop-blur"
        style={{ transform: `rotate(${angle}rad)` }}
      >
        <Icon name="arrowRight" className="h-5 w-5" strokeWidth={2.2} />
      </div>
      <p className="panel panel-tight readout mt-1.5 whitespace-nowrap px-2 py-0.5 text-[10px] text-nav-200">
        {waypoint.label} · {waypoint.distance} m
      </p>
    </div>
  );
}
