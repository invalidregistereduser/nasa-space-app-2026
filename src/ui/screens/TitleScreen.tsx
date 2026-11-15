import { useCallback, useEffect, useState } from 'react';
import { Starfield } from '../canvas/Starfield';
import { Icon } from '../components/Icon';
import { audio, sfx } from '../../audio/AudioEngine';
import { loadGame, saveMeta, setSaveProgress } from '../../state/save';
import { beginPlaying } from '../../state/gameplay';
import { openPanel, resetSpokenKeys, resetState, setPhase, useGame } from '../../state/store';
import { resetFog } from '../../state/fog';
import { MISSION_COUNT } from '../../state/missions';
import { timeAgo } from '../../util/text';

export function TitleScreen() {
  const state = useGame();
  const saving = state.settings.saveProgress;
  const [meta, setMeta] = useState(() => saveMeta());
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setEntered(true), 60);
    return () => window.clearTimeout(id);
  }, []);

  const startNew = () => {
    audio.unlock();
    sfx('ui_click');
    resetFog();
    resetSpokenKeys();
    resetState({ settings: state.settings });
    setPhase('intro');
  };

  const continueRun = () => {
    audio.unlock();
    sfx('ui_click');
    if (loadGame()) {
      resetSpokenKeys();
      beginPlaying();
    }
  };

  // Turning saving off erases the stored run, so the Continue button and the
  // summary beside it have to follow the switch.
  const toggleSaving = useCallback((on: boolean) => {
    audio.unlock();
    sfx('ui_click');
    setSaveProgress(on);
    setMeta(saveMeta());
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-space-950">
      <Starfield marsSize={0.33} marsX={0.78} marsY={0.44} warp={0.03} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-mars-900/50 to-transparent" />
      <div className="vignette pointer-events-none absolute inset-0" />

      {/* The menu scrolls on short windows instead of running off the bottom. */}
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
        <div
          className={`relative z-10 flex min-h-full flex-col justify-center px-6 py-10 transition-all duration-700 sm:px-10 md:px-16 short:py-6 ${
            entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <div className="w-full max-w-xl">
            <p className="label text-mars-300">A 2D Mars survival story</p>
            <h1 className="title-glow mt-4 font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-white short:mt-2 short:text-4xl sm:text-6xl md:text-7xl">
              MARS
              <span className="mt-1 block text-mars-400">THE LAST SIGNAL</span>
            </h1>
            <p className="mt-5 font-display text-xs uppercase tracking-[0.22em] text-nav-200/70 short:mt-3 sm:text-sm sm:tracking-[0.35em]">
              Survive · Explore · Rebuild
            </p>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-slate-300/80 short:mt-3">
              Your descent vehicle came down hard and the crew is scattered. Recover what
              survived, raise a greenhouse that can feed you, and get a signal home.
            </p>

            <div className="mt-9 flex flex-wrap gap-3 short:mt-5">
              <button
                className="btn btn-primary"
                onClick={startNew}
                onMouseEnter={() => sfx('ui_hover')}
              >
                New Mission
              </button>
              <button
                className="btn"
                disabled={!meta}
                onClick={continueRun}
                onMouseEnter={() => sfx('ui_hover')}
              >
                Continue
              </button>
              <button
                className="btn"
                onClick={() => {
                  audio.unlock();
                  sfx('ui_click');
                  openPanel('settings');
                }}
                onMouseEnter={() => sfx('ui_hover')}
              >
                Settings
              </button>
            </div>

            {meta && (
              <div className="mt-4 text-[12.5px] leading-relaxed">
                <p className="text-slate-400">
                  Continue as <span className="text-slate-200">{meta.playerName || 'Astronaut'}</span>,
                  sol {meta.sol}, objective {Math.min(meta.missionIndex + 1, MISSION_COUNT)} of{' '}
                  {MISSION_COUNT}.
                </p>
                <p className="mt-0.5 text-slate-500">
                  <span className="font-display tracking-[0.12em]">{meta.missionTitle}</span> ·
                  saved {timeAgo(meta.savedAt)}
                </p>
              </div>
            )}

            <SaveChoice saving={saving} onChange={toggleSaving} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The player's say over whether anything about their run is kept on this
 * machine. It starts off, and switching it off again deletes what was stored.
 */
function SaveChoice({
  saving,
  onChange,
}: {
  saving: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <div className="mt-8 max-w-md border-t border-white/10 pt-5 short:mt-5 short:pt-4">
      <button
        className="group flex w-full items-start gap-3 text-left"
        onClick={() => onChange(!saving)}
        aria-pressed={saving}
      >
        <span
          className={`mt-px grid h-[18px] w-[18px] shrink-0 place-items-center rounded border transition ${
            saving
              ? 'border-nav-400/70 bg-nav-500/25 text-nav-200'
              : 'border-white/25 text-transparent group-hover:border-white/50'
          }`}
        >
          <Icon name="check" className="h-3 w-3" strokeWidth={3} />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] text-slate-200">
            Save my progress in this browser
          </span>
          <span className="mt-0.5 block text-[12px] leading-relaxed text-slate-500">
            {saving
              ? 'Your run is kept on this device only. Switch this off to erase it.'
              : 'Off. Nothing about your run is stored until you turn this on.'}
          </span>
        </span>
      </button>
    </div>
  );
}
