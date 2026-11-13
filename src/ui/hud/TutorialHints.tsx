import { useGame } from '../../state/store';

interface Hint {
  id: string;
  keys: string[];
  label: string;
  /** Shown only when this is true. */
  when: boolean;
  /** Hidden for good once this is true. */
  done: boolean;
}

function Keycap({ children }: { children: React.ReactNode }) {
  return <kbd className="keycap">{children}</kbd>;
}

/**
 * One idea at a time. Each card appears the first moment its action matters and
 * never comes back once the player has done it.
 */
export function TutorialHints() {
  const state = useGame();
  if (state.ui.panel !== 'none' || state.ui.blackout) return null;
  // The interact prompt already says what E does here — never stack a hint on it.
  if (state.ui.prompt) return null;

  const flags = state.flags;
  const carrying = Object.keys(state.inventory).length > 0;

  const hints: Hint[] = [
    {
      id: 'move',
      keys: ['W', 'A', 'S', 'D'],
      label: 'walk',
      when: true,
      done: !!flags.hasMoved,
    },
    {
      id: 'inventory',
      keys: ['I'],
      label: 'open your inventory',
      when: carrying,
      done: !!flags.tutInventory,
    },
    {
      id: 'map',
      keys: ['M'],
      label: 'open the surface map',
      when: !!flags.roverSurveyed,
      done: !!flags.tutMap,
    },
  ];

  const hint = hints.find((h) => h.when && !h.done);
  if (!hint) return null;

  return (
    <div
      key={hint.id}
      className="panel panel-tight pointer-events-none flex items-center gap-3 px-4 py-2.5 anim-rise"
    >
      <span className="flex items-center gap-1.5">
        {hint.keys.map((k) => (
          <Keycap key={k}>{k}</Keycap>
        ))}
      </span>
      <span className="text-[12.5px] text-slate-300">{hint.label}</span>
    </div>
  );
}
