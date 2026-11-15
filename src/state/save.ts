import type { CropSlot, GameState, Settings } from '../types';
import { deserializeFog, resetFog, serializeFog } from './fog';
import { createInitialState, getState, setSettings, setState } from './store';
import { bus } from '../game/bus';
import { MISSIONS } from './missions';

const SAVE_KEY = 'mars-last-signal/save/v1';
const SETTINGS_KEY = 'mars-last-signal/settings/v1';
const SAVE_VERSION = 1;

export interface SaveMeta {
  playerName: string;
  character: string;
  sol: number;
  missionTitle: string;
  missionIndex: number;
  savedAt: number;
  explored: number;
}

function storage(): Storage | null {
  try {
    const s = window.localStorage;
    const probe = '__mars_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

/**
 * Records the player's answer about keeping a run in this browser and acts on
 * it straight away: turning it on writes the run as it stands, turning it off
 * erases whatever was already stored. It starts off, so a first-time player
 * leaves no trace behind.
 */
export function setSaveProgress(on: boolean) {
  setSettings({ saveProgress: on });
  saveSettings(getState().settings);
  if (on) saveGame();
  else deleteSave();
}

export function saveGame(): boolean {
  const store = storage();
  if (!store) return false;
  const s = getState();
  if (!s.settings.saveProgress) return false;
  if (s.phase !== 'playing' && s.phase !== 'ending') return false;

  const { ui: _ui, ...rest } = s;
  void _ui;
  const payload = {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    state: rest,
    fog: serializeFog(),
  };
  try {
    store.setItem(SAVE_KEY, JSON.stringify(payload));
    bus.emit('ui:saving');
    return true;
  } catch (err) {
    console.warn('[save] could not write save', err);
    return false;
  }
}

function readRaw(): { version: number; savedAt: number; state: GameState; fog: string } | null {
  const store = storage();
  if (!store) return null;
  const raw = store.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== SAVE_VERSION || !parsed.state) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Pads an older save's bed list up to the current count and fills new fields. */
function migrateSlots(saved: CropSlot[] | undefined, fresh: CropSlot[]): CropSlot[] {
  if (!saved?.length) return fresh;
  return fresh.map((blank, index) => {
    const old = saved[index];
    if (!old) return blank;
    return { ...blank, ...old, index, fertilised: old.fertilised ?? false };
  });
}

export function hasSave(): boolean {
  return readRaw() !== null;
}

export function saveMeta(): SaveMeta | null {
  const data = readRaw();
  if (!data) return null;
  const s = data.state;
  return {
    playerName: s.playerName,
    character: s.character,
    sol: s.sol,
    missionIndex: s.missionIndex,
    missionTitle: MISSIONS[s.missionIndex]?.title ?? 'MISSION COMPLETE',
    savedAt: data.savedAt,
    explored: 0,
  };
}

/** Restores a saved run into the live store. Returns false when there is nothing to load. */
export function loadGame(): boolean {
  const data = readRaw();
  if (!data) return false;
  const base = createInitialState();
  // Older saves predate several fields — fall back to the fresh defaults so a
  // run recorded by an earlier build still loads cleanly.
  const restored: GameState = {
    ...base,
    ...data.state,
    greenhouse: {
      ...base.greenhouse,
      ...data.state.greenhouse,
      // Older runs had four beds and no per-row lamps or watering can.
      slots: migrateSlots(data.state.greenhouse?.slots, base.greenhouse.slots),
      lightRows: data.state.greenhouse?.lightRows ?? base.greenhouse.lightRows,
      wateringCan: data.state.greenhouse?.wateringCan ?? 0,
      visited: data.state.greenhouse?.visited ?? false,
      unlockedCrops: data.state.greenhouse?.unlockedCrops ?? base.greenhouse.unlockedCrops,
    },
    // Saves written before the truck existed have no rover block.
    rover: { ...base.rover, ...(data.state.rover ?? {}) },
    resources: { ...base.resources, ...data.state.resources },
    settings: { ...base.settings, ...data.state.settings, ...(loadSettings() ?? {}) },
    stats: { ...base.stats, ...data.state.stats },
    flags: { ...(data.state.flags ?? {}) },
    collected: { ...(data.state.collected ?? {}) },
    discovered: { ...(data.state.discovered ?? {}) },
    inventory: { ...(data.state.inventory ?? {}) },
    codex: data.state.codex ?? [],
    dialogueLog: data.state.dialogueLog ?? [],
    completedMissions: data.state.completedMissions ?? [],
    ui: base.ui,
  };
  deserializeFog(data.fog ?? '');
  setState(restored);
  return true;
}

export function deleteSave() {
  storage()?.removeItem(SAVE_KEY);
  resetFog();
}

/* ------------------------------------------------------------
   Settings persist independently of a run
   ------------------------------------------------------------ */
export function saveSettings(settings: Settings) {
  try {
    storage()?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore quota errors */
  }
}

export function loadSettings(): Partial<Settings> | null {
  const store = storage();
  if (!store) return null;
  const raw = store.getItem(SETTINGS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<Settings>;
  } catch {
    return null;
  }
}
