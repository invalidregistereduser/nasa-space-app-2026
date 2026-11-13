import { useState } from 'react';
import { Icon } from '../components/Icon';
import { useCountUp } from '../components/useCountUp';
import { useGame } from '../../state/store';
import { useLive } from '../../state/live';
import { solClock, solPhase, surfaceTemp } from '../../util/time';

interface Palette {
  from: string;
  to: string;
}

/** Deuteranopia-friendly set keeps the four gauges apart on the blue-yellow axis. */
const PALETTES: Record<string, { normal: Palette; cb: Palette }> = {
  oxygen: { normal: { from: '#8fd8ff', to: '#38dcf8' }, cb: { from: '#9fd8ff', to: '#2f9bff' } },
  water: { normal: { from: '#6fb6f0', to: '#2f8ed6' }, cb: { from: '#b9a6ff', to: '#6f58e0' } },
  food: { normal: { from: '#9ad88a', to: '#46b86a' }, cb: { from: '#ffe08a', to: '#e0b02a' } },
  energy: { normal: { from: '#ffd27a', to: '#f5a524' }, cb: { from: '#ffb08a', to: '#ff6a2a' } },
};

const RADIUS = 17;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface GaugeProps {
  id: keyof typeof PALETTES;
  label: string;
  hint: string;
  icon: string;
  value: number;
  warnAt?: number;
}

/**
 * One life-support reading as a ring. The ring reads at a glance from across the
 * room; the number underneath is there when you want the exact figure.
 */
function Gauge({ id, label, hint, icon, value, warnAt = 25 }: GaugeProps) {
  const state = useGame();
  const [hover, setHover] = useState(false);
  const reduce = state.settings.reduceMotion;
  const shown = useCountUp(value, { duration: 420, reduce });
  const clamped = Math.max(0, Math.min(100, shown));
  const palette = state.settings.colorblind ? PALETTES[id].cb : PALETTES[id].normal;

  const critical = value <= warnAt * 0.55;
  const low = value <= warnAt;
  const colour = critical ? '#ff5a3c' : low ? '#ffb020' : palette.to;

  return (
    <div
      className="group relative flex w-[3.4rem] flex-col items-center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative h-10 w-10">
        <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90">
          <circle
            cx="20"
            cy="20"
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="3.5"
          />
          <circle
            cx="20"
            cy="20"
            r={RADIUS}
            fill="none"
            stroke={colour}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - clamped / 100)}
            style={{
              transition: reduce ? undefined : 'stroke-dashoffset 0.45s cubic-bezier(0.22,1,0.36,1)',
              filter: `drop-shadow(0 0 4px ${colour}90)`,
            }}
          />
        </svg>
        <span
          className={`absolute inset-0 grid place-items-center ${
            critical && !reduce ? 'animate-blink' : ''
          }`}
          style={{ color: colour }}
        >
          <Icon name={icon} className="h-3.5 w-3.5" />
        </span>
      </div>

      <span
        className="readout mt-0.5 text-[11px] leading-none tabular-nums"
        style={{ color: low ? colour : '#e2ecf6' }}
      >
        {Math.round(shown)}
      </span>
      <span className="label mt-[3px] whitespace-nowrap text-[7.5px] leading-none text-slate-500">
        {label}
      </span>

      {hover && (
        <div className="panel panel-tight absolute bottom-[calc(100%+0.4rem)] left-1/2 z-30 w-44 -translate-x-1/2 px-2.5 py-1.5 text-[10.5px] leading-snug text-slate-300 anim-fade">
          {hint}
        </div>
      )}
    </div>
  );
}

export function VitalsCompact() {
  const state = useGame();
  const live = useLive(4);
  const items: [keyof typeof PALETTES, string, string, number, number][] = (
    [
      ['oxygen', 'oxygen', 'O₂', state.resources.oxygen, 30],
      ['water', 'water', 'H₂O', state.resources.water, 35],
      ['food', 'food', 'NUT', state.resources.food, 35],
      ['energy', 'energy', 'PWR', state.resources.energy, 35],
    ] as [keyof typeof PALETTES, string, string, number, number][]
  ).filter(([id, , , value, warnAt]) => id === 'oxygen' || value <= warnAt);
  return (
    <div className="panel panel-tight pointer-events-auto flex items-center gap-2.5 whitespace-nowrap px-3 py-1.5">
      {items.map(([id, icon, label, value, warnAt]) => {
        const low = value <= warnAt;
        const palette = state.settings.colorblind ? PALETTES[id].cb : PALETTES[id].normal;
        const colour = low ? '#ff5a3c' : palette.to;
        return (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1" style={{ color: colour }}>
              <Icon name={icon} className={`h-3 w-3 ${low ? 'animate-blink' : ''}`} />
              <span className="readout text-[11px] tabular-nums">{Math.round(value)}</span>
            </div>
            <div className="h-[3px] w-10 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(0, Math.min(100, value))}%`,
                  background: colour,
                }}
              />
            </div>
          </div>
        );
      })}
      <span className="readout border-l border-white/10 pl-2.5 text-[10px] leading-tight text-slate-400">
        SOL {state.sol}
        <br />
        {solClock(state.solTime)}
      </span>
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          live.sheltered ? 'bg-bio-400 shadow-[0_0_6px_#76dc92]' : 'bg-slate-600'
        }`}
        title={live.sheltered ? 'Pressurised' : 'EVA — suit only'}
      />
    </div>
  );
}

export function Vitals() {
  const state = useGame();
  const { oxygen, water, food, energy } = state.resources;

  // Oxygen is the only reading that forces a decision minute to minute, so it is
  // the only one always on screen. The others appear the moment they matter.
  const gauges = [
    {
      id: 'oxygen' as const,
      label: 'Oxygen',
      hint: 'Drains while you are outside. Refill at the shelter, or use a canister anywhere.',
      icon: 'oxygen',
      value: oxygen,
      warnAt: 30,
      always: true,
    },
    {
      id: 'water' as const,
      label: 'Water',
      hint: 'Drinking and crops both come out of this. The recycler returns most of it.',
      icon: 'water',
      value: water,
      warnAt: 35,
      always: false,
    },
    {
      id: 'food' as const,
      label: 'Nutrition',
      hint: 'Eat a ration, or something you grew once the greenhouse is running.',
      icon: 'food',
      value: food,
      warnAt: 35,
      always: false,
    },
    {
      id: 'energy' as const,
      label: 'Power',
      hint: 'Suit power. Recharges in the shelter, and slowly from a solar array you carry.',
      icon: 'energy',
      value: energy,
      warnAt: 35,
      always: false,
    },
  ].filter((g) => g.always || g.value <= g.warnAt);

  return (
    <div className="panel pointer-events-auto overflow-hidden">
      <div className="flex items-start justify-between gap-1 px-2 pb-2 pt-2.5">
        {gauges.map((g) => (
          <Gauge
            key={g.id}
            id={g.id}
            label={g.label}
            hint={g.hint}
            icon={g.icon}
            value={g.value}
            warnAt={g.warnAt}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 px-2.5 py-1.5 text-[9.5px]">
        <span className="readout text-slate-400">
          {solClock(state.solTime)} · {solPhase(state.solTime)}
        </span>
        <span className="readout text-slate-500">{surfaceTemp(state.solTime)}°C</span>
      </div>
    </div>
  );
}
