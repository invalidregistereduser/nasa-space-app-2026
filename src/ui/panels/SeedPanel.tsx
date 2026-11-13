import type { CropId } from '../../types';
import { PanelShell } from '../components/PanelShell';
import { Icon, ITEM_ICONS } from '../components/Icon';
import { CROPS } from '../../state/items';
import { closePanel, useGame } from '../../state/store';
import { transient } from '../../state/transient';
import { sfx } from '../../audio/AudioEngine';

const ORDER: CropId[] = ['potato', 'lettuce', 'tomato', 'beans', 'herbs', 'wheat'];

/** The seed shelf: take a tin, then press E at any empty bed. */
export function SeedPanel() {
  const state = useGame();
  const unlocked = state.greenhouse.unlockedCrops;

  const take = (crop: CropId) => {
    transient.selectedSeed = crop;
    sfx('plant');
    closePanel();
  };

  return (
    <PanelShell
      title="Seed shelf"
      subtitle="Take a tin, then press E at an empty bed"
      icon="seed"
      accent="bio"
      size="lg"
      onClose={closePanel}
      footer={
        <p className="text-[11px] text-slate-400">
          Seeds flown from Earth are kept cold and dry. More tins unlock as you bring in your first
          harvest.
        </p>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ORDER.map((id) => {
          const def = CROPS[id];
          const open = unlocked.includes(id);
          const held = transient.selectedSeed === id;
          return (
            <button
              key={id}
              disabled={!open}
              onClick={() => take(id)}
              onMouseEnter={() => open && sfx('ui_hover')}
              className={`card-interactive group p-4 text-left ${
                held ? 'ring-1 ring-bio-400/60' : ''
              } ${open ? '' : 'cursor-not-allowed opacity-45'}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border"
                  style={{
                    borderColor: `#${def.color.toString(16).padStart(6, '0')}55`,
                    background: `#${def.color.toString(16).padStart(6, '0')}1a`,
                    color: `#${def.color.toString(16).padStart(6, '0')}`,
                  }}
                >
                  <Icon name={open ? (ITEM_ICONS[id] ?? 'seed') : 'lock'} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-[13px] uppercase tracking-[0.12em] text-white">
                    {def.name}
                  </p>
                  <p className="readout text-[10px] text-slate-500">
                    {Math.round(def.growSeconds)}s · {def.idealTemp}°C · water {Math.round(def.waterUse * 100)}
                  </p>
                </div>
              </div>
              <p className="mt-2.5 text-[12px] leading-relaxed text-slate-300/85">{def.blurb}</p>
              <p className="mt-3 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.16em] text-bio-400">
                {held ? 'In hand' : open ? 'Take a tin' : 'Locked'}
                {open && !held && <Icon name="arrowRight" className="h-3 w-3" />}
              </p>
            </button>
          );
        })}
      </div>
    </PanelShell>
  );
}
