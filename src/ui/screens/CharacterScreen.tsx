import { useState } from 'react';
import type { CharacterId } from '../../types';
import { Starfield } from '../canvas/Starfield';
import { CharacterPreview } from '../canvas/CharacterPreview';
import { Icon } from '../components/Icon';
import { sfx } from '../../audio/AudioEngine';
import { setCharacter, setPhase, useGame } from '../../state/store';

interface Option {
  id: CharacterId;
  name: string;
  role: string;
  bio: string;
  accent: string;
  ring: string;
}

const OPTIONS: Option[] = [
  {
    id: 'male',
    name: 'Commander',
    role: 'Flight engineer · EVA specialist',
    bio: 'Trained on habitat assembly and emergency repair. Steady hands, stubborn optimism.',
    accent: 'text-mars-300',
    ring: 'border-mars-400/60 shadow-[0_0_50px_-12px_rgba(217,102,44,0.8)]',
  },
  {
    id: 'female',
    name: 'Commander',
    role: 'Mission botanist · Systems lead',
    bio: 'Closed-loop life support and crop science. Believes a garden is a kind of engine.',
    accent: 'text-[#b9a4ff]',
    ring: 'border-[#9b7bff]/60 shadow-[0_0_50px_-12px_rgba(155,123,255,0.8)]',
  },
];

export function CharacterScreen() {
  const state = useGame();
  const [selected, setSelected] = useState<CharacterId>(state.character);

  const choose = (id: CharacterId) => {
    setSelected(id);
    setCharacter(id);
    sfx('ui_click');
  };

  return (
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-space-950">
      <Starfield warp={0.05} marsSize={0.9} marsX={0.5} marsY={1.55} />
      <div className="vignette pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center px-6 py-10">
        <div className="text-center">
          <p className="label text-nav-300/70">Crew assignment</p>
          <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
            Choose your astronaut
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Both suits carry identical equipment, {state.playerName || 'astronaut'}. The choice is
            yours — you can change it later from the settings menu.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {OPTIONS.map((option) => {
            const active = selected === option.id;
            return (
              <button
                key={option.id}
                onClick={() => choose(option.id)}
                onMouseEnter={() => sfx('ui_hover')}
                className={`panel scanlines group relative overflow-hidden p-6 text-left transition-all duration-300 ${
                  active ? option.ring : 'border-white/10 hover:border-nav-400/40'
                }`}
              >
                <div className="pointer-events-none absolute inset-0 holo-grid opacity-[0.07]" />
                <div className="relative flex items-start gap-5">
                  <div
                    className={`relative shrink-0 rounded-xl border p-2 transition ${
                      active ? 'border-nav-400/40 bg-nav-500/10' : 'border-white/10 bg-black/30'
                    }`}
                  >
                    <CharacterPreview kind={option.id} scale={2.4} rotate className="drag-none" />
                    {active && (
                      <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-nav-400 text-space-950">
                        <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-display text-lg ${option.accent}`}>
                      {option.name} {state.playerName}
                    </p>
                    <p className="label mt-1 text-[10px] text-slate-400">{option.role}</p>
                    <p className="mt-3 text-[13px] leading-relaxed text-slate-300/80">
                      {option.bio}
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
                      {[
                        ['Oxygen', '100%'],
                        ['Mobility', 'Nominal'],
                        ['Suit', 'ARES Mk-IV'],
                      ].map(([k, v]) => (
                        <div key={k} className="rounded-md border border-white/5 bg-black/30 p-2">
                          <p className="label text-[9px] text-slate-500">{k}</p>
                          <p className="readout mt-0.5 text-nav-200">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            className="btn btn-mars btn-sheen px-10"
            onClick={() => {
              sfx('ui_click');
              setPhase('crash');
            }}
          >
            Begin mission →
          </button>
          <p className="font-mono text-[11px] text-slate-500">
            ARES HORIZON-7 · Final approach in T-minus 00:04:12
          </p>
        </div>
      </div>
    </div>
  );
}
