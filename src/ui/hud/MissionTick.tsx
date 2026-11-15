import { useGame } from '../../state/store';

/**
 * Mission complete. A green tick near the top of the screen for a second and
 * a half, and that is all of it: no banner, no speech, nothing to read.
 */
export function MissionTick() {
  const tick = useGame().ui.missionTick;
  if (tick === null) return null;

  return (
    <div
      key={tick}
      role="status"
      aria-label="Mission complete"
      className="pointer-events-none absolute inset-x-0 top-[17%] z-30 flex justify-center"
    >
      <div className="mission-tick grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-bio-500 shadow-[0_6px_28px_-6px_rgba(72,187,120,0.75)] ring-4 ring-bio-400/25">
        <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" aria-hidden="true">
          <path
            className="mission-tick-mark"
            d="m5 12.5 4.5 4.5L19 7"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
          />
        </svg>
      </div>
    </div>
  );
}
