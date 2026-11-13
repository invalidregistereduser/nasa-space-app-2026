import { useEffect, useRef, useState } from 'react';
import { Starfield } from '../canvas/Starfield';
import { useTypewriter } from '../components/Typewriter';
import { audio, sfx } from '../../audio/AudioEngine';
import { beginPlaying } from '../../state/gameplay';
import { useGame } from '../../state/store';

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t);
/** Normalised progress of a window in the timeline. */
const span = (t: number, from: number, to: number) => clamp((t - from) / (to - from));

const END = 13200;

export function CrashScreen() {
  const state = useGame();
  const [t, setT] = useState(0);
  const finished = useRef(false);
  const cues = useRef(new Set<string>());

  useEffect(() => {
    audio.unlock();
    audio.startAmbient();
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const elapsed = now - start;
      setT(elapsed);
      if (elapsed >= END && !finished.current) {
        finished.current = true;
        beginPlaying();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Audio cues.
  useEffect(() => {
    const fire = (key: string, at: number, fn: () => void) => {
      if (t >= at && !cues.current.has(key)) {
        cues.current.add(key);
        fn();
      }
    };
    fire('whoosh', 2400, () => sfx('whoosh'));
    fire('warn1', 4600, () => sfx('warn'));
    fire('alarm1', 6400, () => sfx('alarm'));
    fire('alarm2', 7600, () => sfx('alarm'));
    fire('rumble', 8400, () => sfx('rumble'));
    fire('impact', 9100, () => sfx('rumble'));
  }, [t]);

  const skip = () => {
    if (finished.current) return;
    finished.current = true;
    sfx('ui_click');
    beginPlaying();
  };

  /* ---- Animated values ---- */
  const marsSize = lerp(0.22, 0.55, span(t, 0, 4200)) + lerp(0, 2.4, span(t, 4200, 8600));
  const marsY = lerp(0.42, 0.92, span(t, 3000, 8600));
  const warp = lerp(0.05, 0.75, span(t, 1800, 6500)) * (1 - span(t, 8600, 9400));
  const glow = span(t, 5600, 8600);

  const shakeAmp =
    span(t, 4600, 5600) * 2 + span(t, 6400, 8400) * 5 + span(t, 8400, 9200) * 16;
  const shake = shakeAmp
    ? {
        transform: `translate(${(Math.random() - 0.5) * shakeAmp}px, ${
          (Math.random() - 0.5) * shakeAmp
        }px)`,
      }
    : undefined;

  const blackout = span(t, 9000, 9900);
  const flash = span(t, 8800, 9050) * (1 - span(t, 9050, 9400));
  const entryHeat = span(t, 6200, 8600) * (1 - span(t, 8900, 9300));
  const atmosphere = span(t, 4000, 7200) * 0.95;

  // Lander transform.
  const lx = lerp(8, 62, span(t, 1600, 8800));
  const ly = lerp(18, 74, span(t, 1600, 8800));
  const lr = lerp(-8, 62, span(t, 4200, 8800));
  const ls = lerp(0.55, 2.3, span(t, 1600, 8800));
  const landerVisible = t > 1500 && t < 9000;

  const caption =
    t < 2200
      ? 'ARES HORIZON-7 · MARS ORBITAL INSERTION'
      : t < 4500
        ? 'DESCENT SEQUENCE INITIATED'
        : t < 6400
          ? 'WARNING · ATTITUDE CONTROL ANOMALY'
          : t < 9000
            ? 'LANDING SYSTEM FAILURE'
            : '';

  const critical = t >= 4500 && t < 9000;
  const alarmPulse = 0.5 + Math.sin(t / 110) * 0.5;

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <div className="absolute inset-0" style={shake}>
        <Starfield
          warp={warp}
          marsSize={marsSize}
          marsX={0.5}
          marsY={marsY}
          glow={glow}
          shootingStars={false}
        />

        {/* Atmospheric entry heat */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 125%, rgba(255,168,70,0.95) 0%, rgba(190,52,16,0.6) 32%, rgba(0,0,0,0) 72%)',
            opacity: entryHeat * 0.95,
          }}
        />
        {/* Haze + vignette that keeps the HUD legible against the planet */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 45%, rgba(18,4,2,0.25) 0%, rgba(14,3,2,0.78) 75%)',
            opacity: atmosphere,
          }}
        />

        {/* Plasma streaks during atmospheric entry. */}
        {entryHeat > 0.12 && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className="absolute w-[2px] rounded-full"
                style={{
                  left: `${(i * 7.3 + 4) % 100}%`,
                  top: `${((i * 23 + (t / 9) % 140) % 140) - 20}%`,
                  height: `${60 + (i % 5) * 40}px`,
                  opacity: entryHeat * (0.25 + (i % 4) * 0.12),
                  background:
                    'linear-gradient(180deg, rgba(255,226,180,0) 0%, rgba(255,206,150,0.9) 50%, rgba(255,160,90,0) 100%)',
                }}
              />
            ))}
          </div>
        )}

        {landerVisible && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: `${lx}%`,
              top: `${ly}%`,
              transform: `translate(-50%, -50%) rotate(${lr}deg) scale(${ls})`,
            }}
          >
            <svg width="150" height="120" viewBox="0 0 150 120" fill="none">
              <defs>
                <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#f2f6fb" />
                  <stop offset="0.55" stopColor="#c0cad7" />
                  <stop offset="1" stopColor="#5d6a78" />
                </linearGradient>
                <radialGradient id="plume" cx="0.5" cy="0.1" r="0.9">
                  <stop offset="0" stopColor="rgba(255,236,190,0.95)" />
                  <stop offset="0.45" stopColor="rgba(255,150,60,0.6)" />
                  <stop offset="1" stopColor="rgba(255,80,30,0)" />
                </radialGradient>
              </defs>
              {t > 3000 && (
                <ellipse cx="42" cy="86" rx="26" ry="34" fill="url(#plume)" opacity={0.9} />
              )}
              <path
                d="M38 30 Q75 18 112 34 L116 60 Q75 76 34 58 Z"
                fill="url(#hull)"
                stroke="#39414e"
                strokeWidth="1.5"
              />
              <path d="M44 36 L108 40" stroke="#c1440e" strokeWidth="4" />
              <circle cx="96" cy="46" r="6" fill="#0f2234" stroke="#aab6c6" strokeWidth="1.5" />
              <path d="M40 58 L28 78 M110 60 L124 78" stroke="#8d99a8" strokeWidth="5" strokeLinecap="round" />
              {t > 5200 && (
                <>
                  <circle cx="70" cy="30" r="3.6" fill="#ff5a3c" opacity={alarmPulse} />
                  <path
                    d="M60 24 q10 -14 22 -6"
                    stroke="rgba(120,120,120,0.6)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    opacity={0.7}
                  />
                </>
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Alarm vignette */}
      {critical && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: `inset 0 0 220px rgba(255,60,40,${0.35 + alarmPulse * 0.4})`,
          }}
        />
      )}

      {/* HUD captions */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-8 md:p-12">
        <div
          className="flex items-start justify-between font-mono text-[11px] uppercase tracking-[0.25em]"
          style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}
        >
          <div className={critical ? 'text-[#ffc9b6]' : 'text-nav-200'}>
            <p>ARES HORIZON-7</p>
            <p className="mt-1 text-slate-300/80">
              ALT {Math.max(0, Math.round(lerp(142, 0, span(t, 1600, 9000)))).toString().padStart(3, '0')} KM ·
              VEL {Math.max(0, Math.round(lerp(5280, 0, span(t, 6000, 9000))))} M/S
            </p>
          </div>
          <p className="text-slate-300/80">SOL 0 · ENTRY INTERFACE</p>
        </div>

        {caption && (
          <div
            className={`mt-[6vh] self-center rounded-2xl border px-7 py-4 text-center backdrop-blur-[2px] ${
              critical
                ? 'border-alert-500/50 bg-black/60 shadow-[0_0_60px_-10px_rgba(255,60,40,0.8)]'
                : 'border-nav-400/25 bg-black/45'
            }`}
          >
            <p
              className={`font-display text-xl font-bold uppercase tracking-[0.28em] sm:text-3xl ${
                critical ? 'text-[#ffd9c8]' : 'text-nav-100'
              }`}
              style={
                critical
                  ? {
                      opacity: 0.72 + alarmPulse * 0.28,
                      textShadow: '0 0 18px rgba(255,70,40,0.9), 0 2px 0 rgba(0,0,0,0.8)',
                    }
                  : { textShadow: '0 2px 12px rgba(0,0,0,0.8)' }
              }
            >
              {caption}
            </p>
            {critical && (
              <p className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.3em] text-alert-500">
                ⚠ Automated landing abort · manual control lost
              </p>
            )}
          </div>
        )}

        <div className="flex-1" />
      </div>

      {/* Impact flash */}
      <div
        className="pointer-events-none absolute inset-0 bg-white"
        style={{ opacity: flash * 0.95 }}
      />
      {/* Fade to black */}
      <div
        className="pointer-events-none absolute inset-0 bg-black"
        style={{ opacity: blackout }}
      />

      {t > 10100 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-8">
          <SolLine name={state.playerName} />
        </div>
      )}

      {!finished.current && (
        <button
          className="absolute bottom-8 right-8 z-30 font-mono text-[11px] uppercase tracking-[0.25em] text-slate-500 transition hover:text-nav-300"
          onClick={skip}
        >
          Skip →
        </button>
      )}
    </div>
  );
}

function SolLine({ name }: { name: string }) {
  const first = useTypewriter('Sol 1. Communication with Earth has been lost.', {
    speed: 52,
    startDelay: 200,
  });
  const second = useTypewriter(`${name}, wake up.`, {
    speed: 60,
    startDelay: 400,
    enabled: first.done,
  });
  return (
    <div className="text-center">
      <p className="font-display text-xl text-slate-200 sm:text-2xl">
        {first.shown}
        {!first.done && <span className="animate-caret text-nav-300">▌</span>}
      </p>
      {first.done && (
        <p className="mt-6 font-display text-lg text-mars-300 sm:text-xl">
          {second.shown}
          {!second.done && <span className="animate-caret text-mars-300">▌</span>}
        </p>
      )}
    </div>
  );
}
