import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { openPanel, useGame } from '../../state/store';
import { sfx } from '../../audio/AudioEngine';
import type { PanelId } from '../../types';

interface Entry {
  panel: PanelId;
  icon: string;
  label: string;
  key: string;
}

const ENTRIES: Entry[] = [
  { panel: 'inventory', icon: 'backpack', label: 'Pack', key: 'I' },
  { panel: 'map', icon: 'map', label: 'Map', key: 'M' },
  { panel: 'nav', icon: 'nav', label: 'Missions', key: 'N' },
  { panel: 'log', icon: 'radio', label: 'Log', key: 'L' },
  { panel: 'pause', icon: 'pause', label: 'Pause', key: 'Esc' },
];

/** Everything that was four buttons, behind one. */
export function MenuButton() {
  const state = useGame();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const carried = Object.values(state.inventory).reduce((a, b) => a + (b ?? 0), 0);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Swallow it so the pause menu does not open behind this one.
      e.preventDefault();
      e.stopImmediatePropagation();
      setOpen(false);
    };
    window.addEventListener('pointerdown', away);
    window.addEventListener('keydown', esc, true);
    return () => {
      window.removeEventListener('pointerdown', away);
      window.removeEventListener('keydown', esc, true);
    };
  }, [open]);

  return (
    <div ref={ref} className="pointer-events-auto relative">
      <button
        aria-label="Menu"
        aria-expanded={open}
        className={`relative grid h-10 w-10 place-items-center rounded-md border transition ${
          open
            ? 'border-white/30 bg-space-800 text-white'
            : 'border-white/12 bg-space-900/85 text-slate-300 hover:border-white/25 hover:text-white'
        }`}
        onClick={() => {
          sfx('ui_open');
          setOpen((v) => !v);
        }}
      >
        <Icon name={open ? 'close' : 'menu'} className="h-4.5 w-4.5" />
        {!open && carried > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-mars-500 px-1 text-[9px] font-bold text-white">
            {carried}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+0.35rem)] w-40 overflow-hidden rounded-md border border-white/12 bg-space-900/95 py-1 anim-fade">
          {ENTRIES.map((e) => (
            <button
              key={e.panel}
              className="flex w-full items-center gap-2.5 px-3 py-[7px] text-left text-[12px] text-slate-300 transition hover:bg-white/8 hover:text-white"
              onClick={() => {
                sfx('ui_open');
                setOpen(false);
                openPanel(e.panel);
              }}
            >
              <Icon name={e.icon} className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <span className="flex-1">{e.label}</span>
              {e.panel === 'inventory' && carried > 0 && (
                <span className="readout text-[10px] text-mars-300">{carried}</span>
              )}
              <span className="readout text-[9.5px] text-slate-600">{e.key}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
