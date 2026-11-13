import { useEffect, useRef, useState } from 'react';
import { Starfield } from '../canvas/Starfield';
import { useTypewriter } from '../components/Typewriter';
import { Icon } from '../components/Icon';
import { audio, sfx } from '../../audio/AudioEngine';
import { exploredFraction } from '../../state/fog';
import { formatDuration } from '../../util/text';
import { resetLive } from '../../state/live';
import { setPhase, useGame } from '../../state/store';
import { beginPlaying } from '../../state/gameplay';
import { saveGame } from '../../state/save';

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const span = (t: number, from: number, to: number) => clamp((t - from) / (to - from));

export function EndingScreen() {
  const state = useGame();
  const [t, setT] = useState(0);
  const fired = useRef(false);

  useEffect(() => {
    saveGame();
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT(now - start);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (t > 400 && !fired.current) {
      fired.current = true;
      sfx('transmit');
      audio.swell();
    }
  }, [t]);

  const rise = span(t, 3200, 11000);
  const showStats = t > 10200;
  const groundY = rise * 46;
  const ringPhase = (t % 2200) / 2200;

  return (
    <div className="relative h-full w-full overflow-hidden bg-space-950">
      <Starfield warp={0.02} marsSize={0} shootingStars />

      {/* Martian horizon silhouette that drops away as the camera rises */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%]"
        style={{ transform: `translateY(${groundY}%)` }}
      >
        <svg viewBox="0 0 1200 420" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="glowSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(120,60,40,0)" />
              <stop offset="1" stopColor="rgba(150,70,40,0.55)" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="1200" height="420" fill="url(#glowSky)" />
          <path
            d="M0 250 L120 215 L240 245 L350 195 L470 240 L600 205 L720 250 L840 225 L960 255 L1080 220 L1200 248 L1200 420 L0 420 Z"
            fill="#160a06"
          />
          <path
            d="M0 300 L160 275 L320 305 L520 270 L700 310 L900 280 L1100 312 L1200 295 L1200 420 L0 420 Z"
            fill="#0c0503"
          />
          {/* Transmitter mast + astronaut */}
          <g transform="translate(600 300)">
            <path d="M-10 0 L-5 -120 M10 0 L5 -120" stroke="#2a1d16" strokeWidth="4" />
            <path d="M-8 -30 L8 -50 M8 -30 L-8 -50 M-7 -60 L7 -80 M7 -60 L-7 -80" stroke="#241913" strokeWidth="2.5" />
            <ellipse cx="0" cy="-130" rx="26" ry="16" fill="#1d1410" stroke="#3a2a20" strokeWidth="2" />
            <circle cx="0" cy="-130" r="4" fill="#38dcf8" opacity={0.6 + Math.sin(t / 220) * 0.4} />
          </g>
          <g transform="translate(680 302)">
            <ellipse cx="0" cy="2" rx="10" ry="3" fill="rgba(0,0,0,0.5)" />
            <rect x="-6" y="-22" width="12" height="18" rx="5" fill="#120a07" />
            <circle cx="0" cy="-27" r="7" fill="#150c08" />
            <circle cx="2" cy="-28" r="4" fill="rgba(56,220,248,0.35)" />
          </g>
        </svg>
      </div>

      {/* Signal rings */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{ bottom: `${30 - groundY * 0.6}%` }}
      >
        {[0, 1, 2].map((i) => {
          const p = (ringPhase + i / 3) % 1;
          return (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 rounded-full border"
              style={{
                width: `${p * 900}px`,
                height: `${p * 300}px`,
                marginLeft: `${-p * 450}px`,
                marginTop: `${-p * 150}px`,
                borderColor: `rgba(56,220,248,${(1 - p) * 0.55})`,
              }}
            />
          );
        })}
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        {!showStats ? (
          <Lines name={state.playerName} t={t} />
        ) : (
          <div className="anim-rise w-full max-w-3xl">
            <p className="font-display text-xs uppercase tracking-[0.5em] text-nav-300/70">
              To be continued...
            </p>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-tight text-white title-glow sm:text-5xl">
              NASA
              <span className="block text-mars-400">LAST MISSION</span>
            </h2>
            <p className="mt-4 text-sm text-slate-400">
              Sol {state.sol} · Commander {state.playerName} · ARES HORIZON-7 still transmitting
            </p>

            <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                ['Sols survived', String(state.sol), 'sun'],
                ['Surface explored', `${Math.round(exploredFraction() * 100)}%`, 'map'],
                ['Distance walked', `${Math.round(state.stats.metresWalked)} m`, 'compass'],
                ['Crops harvested', String(state.greenhouse.harvests), 'plant'],
                ['Items recovered', String(state.stats.itemsFound), 'box'],
                ['Mission time', formatDuration(state.elapsed), 'clock'],
              ].map(([label, value, icon]) => (
                <div key={label} className="panel panel-tight p-3">
                  <p className="label flex items-center justify-center gap-1.5 text-[9px]">
                    <Icon name={icon} className="h-3 w-3" />
                    {label}
                  </p>
                  <p className="readout mt-1 text-xl text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                className="btn btn-primary btn-sheen"
                onClick={() => {
                  sfx('ui_click');
                  beginPlaying();
                }}
              >
                Keep exploring
              </button>
              <button
                className="btn"
                onClick={() => {
                  sfx('ui_click');
                  resetLive();
                  audio.stopAmbient();
                  setPhase('title');
                }}
              >
                Return to title
              </button>
            </div>

            <p className="mt-6 text-[11px] leading-relaxed text-slate-500">
              Built for the NASA Space Apps Challenge · every sprite, sound and star generated
              in-browser from code.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Lines({ name, t }: { name: string; t: number }) {
  const first = useTypewriter('Emergency signal transmitted.', { speed: 46, startDelay: 600 });
  const second = useTypewriter(`Earth, this is Commander ${name}.`, {
    speed: 52,
    enabled: t > 3600,
  });
  const third = useTypewriter('ARES HORIZON-7 is still alive.', {
    speed: 58,
    enabled: t > 6600,
  });

  return (
    <div className="space-y-6">
      <p className="font-display text-lg uppercase tracking-[0.3em] text-nav-300 sm:text-xl">
        {first.shown}
        {!first.done && <span className="animate-caret">▌</span>}
      </p>
      {t > 3600 && (
        <p className="font-display text-2xl text-slate-100 sm:text-3xl">
          {second.shown}
          {!second.done && <span className="animate-caret text-nav-300">▌</span>}
        </p>
      )}
      {t > 6600 && (
        <p className="font-display text-2xl text-mars-300 sm:text-3xl">
          {third.shown}
          {!third.done && <span className="animate-caret text-mars-300">▌</span>}
        </p>
      )}
    </div>
  );
}
