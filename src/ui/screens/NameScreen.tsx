import { useEffect, useRef, useState } from 'react';
import { Starfield } from '../canvas/Starfield';
import { useTypewriter } from '../components/Typewriter';
import { Icon } from '../components/Icon';
import { sfx } from '../../audio/AudioEngine';
import { setPhase, setPlayerName } from '../../state/store';

const MAX = 14;
const VALID = /^[\p{L}\p{N} '\-.]*$/u;

export function NameScreen() {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prompt = useTypewriter('Before we begin, astronaut. What is your name?', {
    speed: 36,
    startDelay: 350,
  });

  useEffect(() => {
    if (prompt.done) inputRef.current?.focus();
  }, [prompt.done]);

  const submit = () => {
    const name = value.trim().replace(/\s+/g, ' ');
    if (name.length < 2) {
      setError('Please enter at least 2 characters.');
      sfx('warn');
      return;
    }
    if (!VALID.test(name)) {
      setError('Letters, numbers, spaces and hyphens only.');
      sfx('warn');
      return;
    }
    sfx('ui_click');
    setPlayerName(name);
    setPhase('character');
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-space-950">
      <Starfield warp={0.08} marsSize={0.14} marsX={0.85} marsY={0.78} />
      <div className="vignette pointer-events-none absolute inset-0" />

      <div className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden">
        <div className="flex min-h-full items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <p className="label mb-5 text-nav-300/70">Crew registration</p>
          <h2 className="min-h-[4.5rem] font-display text-2xl leading-snug text-slate-100 sm:text-3xl">
            {prompt.shown}
            {!prompt.done && <span className="animate-caret text-nav-300">▌</span>}
          </h2>

          {prompt.done && (
            <div className="anim-rise mt-8">
              <label className="label mb-2 block" htmlFor="astronaut-name">
                Enter your name
              </label>
              <div className="panel flex items-center gap-3 px-4 py-3">
                <Icon name="flag" className="h-4 w-4 shrink-0 text-nav-300" />
                <input
                  id="astronaut-name"
                  ref={inputRef}
                  value={value}
                  maxLength={MAX}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-transparent font-display text-lg tracking-[0.15em] text-white outline-none placeholder:text-slate-600"
                  onChange={(e) => {
                    setValue(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submit();
                  }}
                />
                <span className="readout shrink-0 text-[11px] text-slate-500">
                  {value.length}/{MAX}
                </span>
              </div>

              <div className="mt-3 flex min-h-[1.25rem] items-center justify-between">
                <p className="text-xs text-alert-500">{error}</p>
                <p className="font-mono text-[11px] text-slate-500">
                  ARES NAV will use this name for the rest of the mission
                </p>
              </div>

              <button className="btn btn-primary mt-6 w-full sm:w-auto" onClick={submit}>
                Confirm identity
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
