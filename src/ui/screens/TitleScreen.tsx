import { useEffect, useState } from 'react';
import { Starfield } from '../canvas/Starfield';
import { Icon } from '../components/Icon';
import { audio, sfx } from '../../audio/AudioEngine';
import { hasSave, loadGame, saveMeta } from '../../state/save';
import { beginPlaying } from '../../state/gameplay';
import { openPanel, resetSpokenKeys, resetState, setPhase, useGame } from '../../state/store';
import { resetFog } from '../../state/fog';
import { MISSION_COUNT } from '../../state/missions';

export function TitleScreen() {
  const state = useGame();
  const [meta] = useState(() => saveMeta());
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

  return (
    <div className="relative h-full w-full overflow-hidden bg-space-950">
      <Starfield marsSize={0.33} marsX={0.78} marsY={0.44} warp={0.03} />

      {/* Horizon glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-mars-900/50 to-transparent" />
      <div className="vignette pointer-events-none absolute inset-0" />

      <div
        className={`relative z-10 flex h-full flex-col justify-between px-8 py-8 transition-all duration-1000 md:px-16 md:py-12 ${
          entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <header className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded-full border border-nav-400/40 bg-nav-500/10">
              <Icon name="compass" className="h-5 w-5 text-nav-300" />
              <span className="absolute inset-0 animate-pulse-ring rounded-full border border-nav-400/40" />
            </div>
            <div>
              <p className="label">ARES PROGRAM</p>
              <p className="font-mono text-[11px] text-nav-200/60">MISSION ARCHIVE // 2041</p>
            </div>
          </div>
          <p className="hidden font-mono text-[11px] text-nav-200/40 sm:block">
            NASA SPACE APPS CHALLENGE
          </p>
        </header>

        <main className="max-w-xl">
          <p className="label mb-4 text-mars-300">A 2D Mars survival story</p>
          <h1 className="animate-flicker font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-white title-glow sm:text-6xl md:text-7xl">
            MARS
            <span className="mt-1 block text-mars-400">THE LAST SIGNAL</span>
          </h1>
          <p className="mt-5 font-display text-sm uppercase tracking-[0.4em] text-nav-200/70">
            Survive · Explore · Rebuild
          </p>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-slate-300/80">
            Your descent vehicle came down hard and the crew is scattered. Recover what
            survived, raise a greenhouse that can feed you, and get a signal home.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              className="btn btn-primary btn-sheen"
              onClick={startNew}
              onMouseEnter={() => sfx('ui_hover')}
            >
              New Mission
            </button>
            <button
              className="btn"
              disabled={!hasSave()}
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
            <div className="panel panel-tight mt-6 inline-flex items-center gap-4 px-4 py-3 text-xs">
              <Icon name="save" className="h-4 w-4 text-nav-300" />
              <div>
                <p className="font-display text-[11px] uppercase tracking-[0.2em] text-nav-200">
                  Saved run · {meta.playerName || 'Astronaut'}
                </p>
                <p className="readout mt-0.5 text-[11px] text-slate-400">
                  SOL {meta.sol} · Objective {Math.min(meta.missionIndex + 1, MISSION_COUNT)}/
                  {MISSION_COUNT} · {meta.missionTitle}
                </p>
              </div>
            </div>
          )}
        </main>

        <footer className="flex flex-wrap items-end justify-between gap-4 text-[11px] text-slate-500">
          <p className="max-w-sm leading-relaxed">
            Every sprite, sound and star in this game is generated in the browser from code —
            there are no external art or audio assets.
          </p>
          <p className="font-mono">v1.0 · WASD to walk · E to interact</p>
        </footer>
      </div>
    </div>
  );
}
