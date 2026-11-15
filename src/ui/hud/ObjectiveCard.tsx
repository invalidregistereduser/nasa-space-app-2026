import { useState } from 'react';
import { Icon } from '../components/Icon';
import { openPanel, useGame } from '../../state/store';
import { MISSIONS, MISSION_COUNT } from '../../state/missions';
import { useLive } from '../../state/live';
import { sfx } from '../../audio/AudioEngine';
import { useCoarsePointer } from './useCoarsePointer';

/** Keyboard wording makes no sense under a thumb. */
function forTouch(text: string) {
  return text
    .replace(/\bWASD(\/arrow keys| or the arrow keys)?\b/g, 'the stick')
    .replace(/\bpress E\b/gi, 'tap E')
    .replace(/\bSHIFT\b/g, 'the stick edge');
}

/**
 * Which mission you are on and the one thing it asks for. Nothing announces
 * a new mission any more, so this card is where the player looks to find out
 * what is next. Rest the pointer on it for the distance to the marker.
 */
export function ObjectiveCard() {
  const state = useGame();
  const live = useLive(4);
  const touch = useCoarsePointer();
  const [open, setOpen] = useState(false);

  const mission = MISSIONS[state.missionIndex];
  const complete = !mission;
  const step = Math.min(state.missionIndex + 1, MISSION_COUNT);

  const raw = mission
    ? mission.objectiveOf
      ? mission.objectiveOf(state)
      : mission.objective
    : 'Nothing left to do';
  const objective = touch ? forTouch(raw) : raw;
  const title = complete ? 'All done' : mission.title;

  return (
    <div
      className="pointer-events-auto relative flex flex-col items-end"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="flex w-[15rem] max-w-[64vw] items-start gap-2 rounded-md border border-white/12 bg-space-900/85 py-1.5 pl-1.5 pr-3 text-left transition hover:border-white/25"
        onClick={() => {
          sfx('ui_open');
          openPanel('nav');
        }}
        title="Mission log (N)"
      >
        <span
          className={`grid h-5 w-5 shrink-0 place-items-center rounded text-[10px] font-bold tabular-nums ${
            complete ? 'bg-bio-600/40 text-bio-200' : 'bg-mars-600/40 text-mars-200'
          }`}
        >
          {complete ? '✓' : String(step).padStart(2, '0')}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block pt-[3px] font-display text-[10.5px] uppercase leading-[1.35] tracking-[0.1em] text-slate-200">
            {title}
          </span>
          <span className="mt-1 block text-[11.5px] leading-snug text-slate-400">{objective}</span>
        </span>
      </button>

      {open && live.waypoint && (
        <div className="absolute right-0 top-[calc(100%+0.3rem)] w-[15rem] max-w-[64vw] rounded-md border border-white/12 bg-space-900/95 px-3 py-2 anim-fade">
          <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Icon name="compass" className="h-3 w-3 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{live.waypoint.label}</span>
            <span className="readout tabular-nums">{Math.round(live.waypoint.distance)} m</span>
          </p>
        </div>
      )}
    </div>
  );
}
