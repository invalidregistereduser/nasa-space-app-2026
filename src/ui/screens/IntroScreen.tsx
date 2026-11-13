import { useCallback, useEffect, useState } from 'react';
import { Starfield } from '../canvas/Starfield';
import { useTypewriter } from '../components/Typewriter';
import { Icon } from '../components/Icon';
import { sfx } from '../../audio/AudioEngine';
import { setPhase } from '../../state/store';

const LINES = [
  'Year 2041...',
  'After years of preparation, humanity launched another mission toward Mars.',
  'Your spacecraft has travelled millions of kilometres across the dark.',
  'Six crew. One outpost. The first serious attempt to live off this world.',
  'But something is about to go terribly wrong.',
];

export function IntroScreen() {
  const [index, setIndex] = useState(0);
  const line = LINES[index];
  const { shown, done, finish } = useTypewriter(line, { speed: 38, startDelay: 420 });

  const advance = useCallback(() => {
    if (!done) {
      finish();
      return;
    }
    sfx('ui_click');
    if (index < LINES.length - 1) setIndex((i) => i + 1);
    else setPhase('name');
  }, [done, finish, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advance();
      } else if (e.key === 'Escape') {
        setPhase('name');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance]);

  return (
    <div
      className="relative h-full w-full cursor-pointer overflow-hidden bg-space-950"
      onClick={advance}
    >
      <Starfield warp={0.1} marsSize={0.1} marsX={0.82} marsY={0.22} />
      <div className="vignette pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-8">
        <div className="w-full max-w-3xl">
          <p className="label mb-6 text-nav-300/60">
            Transmission log · {String(index + 1).padStart(2, '0')} /{' '}
            {String(LINES.length).padStart(2, '0')}
          </p>
          <p className="min-h-[7rem] font-display text-2xl leading-relaxed text-slate-100 sm:text-3xl md:text-[2.1rem] md:leading-[1.35]">
            {shown}
            {!done && <span className="animate-caret text-nav-300">▌</span>}
          </p>

          <div className="mt-10 flex h-12 items-center gap-5">
            {done && (
              <button
                className="group flex h-12 w-12 items-center justify-center rounded-full border border-nav-400/50 bg-nav-500/10 text-nav-200 transition hover:border-nav-300 hover:bg-nav-500/20 anim-fade"
                onClick={(e) => {
                  e.stopPropagation();
                  advance();
                }}
                aria-label="Next line"
              >
                <Icon name="arrowRight" className="h-5 w-5 animate-nudge" />
              </button>
            )}
            {done && (
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500 anim-fade">
                Click, Enter or Space to continue
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        className="absolute bottom-8 right-8 z-10 font-mono text-[11px] uppercase tracking-[0.25em] text-slate-500 transition hover:text-nav-300"
        onClick={(e) => {
          e.stopPropagation();
          sfx('ui_click');
          setPhase('name');
        }}
      >
        Skip intro →
      </button>
    </div>
  );
}
