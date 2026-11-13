import { useState } from 'react';
import type { ItemId } from '../../types';
import { PanelShell } from '../components/PanelShell';
import { Icon, ITEM_ICONS } from '../components/Icon';
import { ITEMS } from '../../state/items';
import { useItem } from '../../state/gameplay';
import { closePanel, useGame } from '../../state/store';
import { transient } from '../../state/transient';
import { sfx } from '../../audio/AudioEngine';

const CATEGORY_LABEL: Record<string, string> = {
  survival: 'Survival',
  component: 'Mission components',
  harvest: 'Grown on Mars',
};

const USABLE: ItemId[] = ['oxygen_canister', 'ration_pack', 'potato', 'lettuce', 'wheat'];

export function InventoryPanel() {
  const state = useGame();
  // Snapshot the "new" set on mount, then clear it so badges show exactly once.
  const [fresh] = useState(() => {
    const seen = new Set(transient.newItems);
    transient.newItems.clear();
    return seen;
  });
  const [tooltip, setTooltip] = useState<ItemId | null>(null);
  const entries = (Object.keys(state.inventory) as ItemId[]).filter(
    (id) => (state.inventory[id] ?? 0) > 0,
  );
  const [selected, setSelected] = useState<ItemId | null>(entries[0] ?? null);
  const active = selected && (state.inventory[selected] ?? 0) > 0 ? selected : (entries[0] ?? null);
  const def = active ? ITEMS[active] : null;

  const groups = ['survival', 'component', 'harvest'].map((category) => ({
    category,
    items: entries.filter((id) => ITEMS[id].category === category),
  }));

  return (
    <PanelShell
      title="Suit inventory"
      subtitle={`${entries.reduce((n, id) => n + (state.inventory[id] ?? 0), 0)} items carried`}
      icon="backpack"
      size="lg"
      onClose={closePanel}
    >
      {entries.length === 0 ? (
        <div className="grid place-items-center py-16 text-center">
          <Icon name="backpack" className="mb-3 h-10 w-10 text-slate-700" />
          <p className="text-sm text-slate-400">Your suit pouches are empty.</p>
          <p className="mt-1 text-xs text-slate-600">
            Follow the ARES NAV marker and press E to recover equipment.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            {groups.map(
              (group) =>
                group.items.length > 0 && (
                  <div key={group.category}>
                    <p className="label mb-2">{CATEGORY_LABEL[group.category]}</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {group.items.map((id) => {
                        const count = state.inventory[id] ?? 0;
                        const isActive = active === id;
                        return (
                          <button
                            key={id}
                            onClick={() => {
                              sfx('ui_hover');
                              setSelected(id);
                            }}
                            onMouseEnter={() => setTooltip(id)}
                            onMouseLeave={() => setTooltip((t) => (t === id ? null : t))}
                            className={`group relative flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition ${
                              isActive
                                ? 'border-nav-400/60 bg-nav-500/10'
                                : 'border-white/10 bg-black/20 hover:border-white/25'
                            }`}
                          >
                            <div
                              className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border ${
                                isActive
                                  ? 'border-nav-400/50 text-nav-200'
                                  : 'border-white/10 text-slate-300'
                              }`}
                            >
                              <Icon name={ITEM_ICONS[id] ?? 'box'} className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[12.5px] text-slate-100">
                                {ITEMS[id].name}
                              </p>
                              <p className="readout text-[10px] text-slate-500">×{count}</p>
                            </div>
                            {fresh.has(id) && (
                              <span className="absolute -right-1.5 -top-1.5 rounded-full bg-bio-500 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-space-950">
                                New
                              </span>
                            )}
                            {tooltip === id && (
                              <span className="panel panel-tight absolute -top-10 left-0 z-20 whitespace-nowrap px-2.5 py-1 text-[10.5px] text-slate-300">
                                {ITEMS[id].blurb}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ),
            )}
          </div>

          {def && (
            <aside className="panel panel-tight h-max p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg border border-nav-400/30 bg-nav-500/10 text-nav-200">
                  <Icon name={ITEM_ICONS[def.id] ?? 'box'} className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-[13px] uppercase tracking-[0.12em] text-white">
                    {def.name}
                  </p>
                  <p className="readout text-[10px] text-slate-500">
                    ×{state.inventory[def.id]} · {CATEGORY_LABEL[def.category]}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-[12.5px] leading-relaxed text-slate-300">{def.blurb}</p>

              {def.science && (
                <div className="mt-3 rounded-lg border border-nav-400/20 bg-nav-500/5 p-2.5">
                  <p className="label mb-1 flex items-center gap-1.5 text-[9px]">
                    <Icon name="science" className="h-3 w-3" />
                    Real mission science
                  </p>
                  <p className="text-[11.5px] leading-relaxed text-nav-200/80">{def.science}</p>
                </div>
              )}

              {USABLE.includes(def.id) && (
                <button
                  className="btn btn-primary mt-4 w-full py-2 text-[11px]"
                  onClick={() => useItem(def.id)}
                >
                  {def.category === 'harvest' || def.id === 'ration_pack' ? 'Consume' : 'Use now'}
                </button>
              )}
            </aside>
          )}
        </div>
      )}
    </PanelShell>
  );
}
