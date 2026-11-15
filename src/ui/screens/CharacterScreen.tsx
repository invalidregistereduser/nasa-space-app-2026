import { useState } from 'react';
import type { CharacterId } from '../../types';
import { Starfield } from '../canvas/Starfield';
import { CharacterPreview } from '../canvas/CharacterPreview';
import { Icon } from '../components/Icon';
import { sfx } from '../../audio/AudioEngine';
import { setCharacter, setPhase, useGame } from '../../state/store';

interface Option {
  id: CharacterId;
  role: string;
  bio: string;
  accent: string;
}

/**
 * The two suits are mechanically identical, so the only thing that separates
 * them is who is inside. No stat lines: there is nothing to compare.
 */
const OPTIONS: Option[] = [
  {
    id: 'male',
    role: 'Flight engineer',
    bio: 'Trained on habitat assembly and emergency repair. Steady hands, stubborn optimism.',
    accent: 'text-mars-300',
  },
  {
    id: 'female',
    role: 'Mission botanist',
    bio: 'Closed-loop life support and crop science. Believes a garden is a kind of engine.',
    accent: 'text-[#b9a4ff]',
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

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-4xl flex-col justify-center px-6 py-12">
        <div className="text-center">
          <p className="label text-nav-300/70">Crew assignment</p>
          <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
            Choose your astronaut
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Both suits carry the same equipment. You can change this later in Settings.
          </p>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {OPTIONS.map((option) => {
            const active = selected === option.id;
            return (
              <button
                key={option.id}
                onClick={() => choose(option.id)}
                onMouseEnter={() => sfx('ui_hover')}
                aria-pressed={active}
                className={`panel flex items-start gap-5 p-5 text-left transition ${
                  active ? 'border-nav-400/60' : 'hover:border-white/25'
                }`}
              >
                <div
                  className={`relative shrink-0 rounded-lg border p-2 transition ${
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
                  <p className={`font-display text-lg ${option.accent}`}>{option.role}</p>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-slate-300/80">
                    {option.bio}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-9 flex justify-center">
          <button
            className="btn btn-mars px-10"
            onClick={() => {
              sfx('ui_click');
              setPhase('crash');
            }}
          >
            Begin mission
          </button>
        </div>
      </div>
    </div>
  );
}
