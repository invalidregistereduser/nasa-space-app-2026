import { useSyncExternalStore } from 'react';
import type {
  CharacterId,
  CodexEntry,
  CropSlot,
  DialogueTone,
  GameState,
  InteractPrompt,
  ItemId,
  PanelId,
  Phase,
  Settings,
  ToastKind,
} from '../types';
import { SPAWN, STRUCTURES } from '../game/constants';
import { transient } from './transient';

/** Six beds, laid out as three rows of two inside the greenhouse. */
export const BED_COUNT = 6;
export const BED_ROWS = 3;

/* ============================================================
   Store container
   ============================================================ */
let state: GameState = createInitialState();
const listeners = new Set<() => void>();

export function getState(): GameState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  listeners.forEach((l) => l());
}

export function setState(
  patch: Partial<GameState> | ((s: GameState) => Partial<GameState>),
): void {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  emit();
}

/** Convenience updater for the nested `ui` slice. */
export function setUI(patch: Partial<GameState['ui']>) {
  state = { ...state, ui: { ...state.ui, ...patch } };
  emit();
}

export function useGame(): GameState {
  return useSyncExternalStore(subscribe, getState, getState);
}

/* ============================================================
   Initial state
   ============================================================ */
export function makeSlots(count = BED_COUNT): CropSlot[] {
  return Array.from({ length: count }, (_, index) => ({
    index,
    crop: null,
    growth: 0,
    water: 0,
    health: 100,
    ready: false,
    fertilised: false,
  }));
}

export function createInitialState(): GameState {
  return {
    phase: 'title',
    playerName: '',
    character: 'male',

    sol: 1,
    solTime: 0.34,
    elapsed: 0,

    resources: { oxygen: 94, water: 82, food: 76, energy: 90 },
    inventory: {},
    collected: {},
    discovered: { crash_site: true },

    missionIndex: 0,
    completedMissions: [],

    greenhouse: {
      siteId: null,
      built: false,
      power: false,
      waterConnected: false,
      containersReady: false,
      temperature: 19,
      light: 70,
      lightRows: [true, true, true],
      wateringCan: 0,
      visited: false,
      charge: 0,
      slots: makeSlots(),
      harvests: 0,
      unlockedCrops: ['potato', 'lettuce'],
    },
    rover: { x: STRUCTURES.rover.x + 120, y: STRUCTURES.rover.y + 34, fixed: false },
    flags: {},
    codex: [],
    dialogueLog: [],

    playerX: SPAWN.x,
    playerY: SPAWN.y,

    settings: {
      master: 0.75,
      music: 0.5,
      sfx: 0.8,
      showWaypointArrow: true,
      showHints: true,
      screenShake: true,
      reduceMotion: false,
      textSpeed: 'normal',
      uiScale: 1,
      colorblind: false,
      // Opt-in: nothing is written to the player's browser until they say so.
      saveProgress: false,
    },

    ui: {
      panel: 'none',
      prompt: null,
      dialogue: [],
      toasts: [],
      missionTick: null,
      cinematic: null,
      waypointOverride: null,
      paused: false,
      blackout: false,
    },

    stats: { itemsFound: 0, metresWalked: 0, startedAt: Date.now() },
  };
}

export function resetState(keep?: Partial<GameState>) {
  state = { ...createInitialState(), ...keep };
  emit();
}

/* ============================================================
   Phase / identity
   ============================================================ */
export function setPhase(phase: Phase) {
  setState({ phase });
}

export function setPlayerName(playerName: string) {
  setState({ playerName });
}

export function setCharacter(character: CharacterId) {
  setState({ character });
}

export function setSettings(patch: Partial<Settings>) {
  setState((s) => ({ settings: { ...s.settings, ...patch } }));
}

/* ============================================================
   Dialogue — ARES NAV speech queue
   ============================================================ */
let dialogueId = 1;
const spokenKeys = new Set<string>();

export interface SayOptions {
  tone?: DialogueTone;
  speaker?: string;
  /** When given, the same key will never be queued twice. */
  key?: string;
  /** Put this message at the front of the queue. */
  urgent?: boolean;
}

export function say(lines: string[], opts: SayOptions = {}) {
  if (!lines.length) return;
  if (opts.key) {
    if (spokenKeys.has(opts.key)) return;
    spokenKeys.add(opts.key);
  }
  const message = {
    id: dialogueId++,
    speaker: opts.speaker ?? 'ARES NAV',
    lines,
    tone: opts.tone ?? ('normal' as DialogueTone),
  };
  setUI({
    dialogue: opts.urgent
      ? [message, ...state.ui.dialogue]
      : [...state.ui.dialogue, message],
    // A warning should not have to wait behind "Can filled".
    toasts: message.tone === 'alert' ? [] : state.ui.toasts,
  });
  logLines(message.id, message.speaker, lines);
}

function logLines(id: number, speaker: string, lines: string[]) {
  const entry = { id, speaker, lines, sol: state.sol };
  setState({ dialogueLog: [...state.dialogueLog.slice(-59), entry] });
}

/**
 * Files something in the radio log without putting it on screen. Stored
 * messages from home arrive this way: they wait in the log until the player
 * has a quiet minute to read them.
 */
export function fileInLog(speaker: string, lines: string[]) {
  logLines(dialogueId++, speaker, lines);
  setFlag('logUnread');
}

export function advanceDialogue() {
  if (!state.ui.dialogue.length) return;
  setUI({ dialogue: state.ui.dialogue.slice(1) });
}

export function clearDialogue() {
  setUI({ dialogue: [] });
}

/* ============================================================
   One thing on screen at a time
   ============================================================ */
/** True while a message is already up and anything new should wait its turn. */
export function hudBusy(s: GameState = state) {
  return s.ui.missionTick !== null || s.ui.toasts.length > 0 || s.ui.dialogue.length > 0;
}

const TICK_MS = 1700;
let tickId = 1;

/**
 * The whole of the "mission complete" moment: a green tick, and nothing
 * else. Whatever was on screen makes way for it, apart from a live warning.
 */
export function showMissionTick() {
  const id = tickId++;
  setUI({
    missionTick: id,
    toasts: [],
    dialogue: state.ui.dialogue.filter((d) => d.tone === 'alert'),
  });
  window.setTimeout(() => {
    if (state.ui.missionTick === id) setUI({ missionTick: null });
  }, TICK_MS);
}

export function resetSpokenKeys() {
  spokenKeys.clear();
}

/* ============================================================
   Toasts
   ============================================================ */
let toastId = 1;

export function toast(opts: {
  kind?: ToastKind;
  title: string;
  text?: string;
  note?: string;
  icon?: string;
  ttl?: number;
}) {
  const id = toastId++;
  const ttl = opts.ttl ?? 4200;
  const entry = {
    id,
    kind: opts.kind ?? ('info' as ToastKind),
    title: opts.title,
    text: opts.text,
    note: opts.note,
    icon: opts.icon,
    born: Date.now(),
    ttl,
  };
  // One at a time. Anything else is noise stacked on noise.
  setUI({ toasts: [entry] });
  window.setTimeout(() => {
    setUI({ toasts: state.ui.toasts.filter((t) => t.id !== id) });
  }, ttl);
}

/* ============================================================
   Science log
   ============================================================ */
/** Adds an entry to the science log. Quietly: it is there when the player looks. */
export function learn(id: string, title: string, body: string) {
  if (!body) return;
  if (state.codex.some((c) => c.id === id)) return;
  const entry: CodexEntry = { id, title, body, sol: state.sol };
  setState({ codex: [...state.codex, entry] });
}

/* ============================================================
   UI panels & prompts
   ============================================================ */
export function openPanel(panel: PanelId) {
  if (state.ui.panel === panel) return;
  setUI({ panel, paused: panel === 'pause' });
  if (panel === 'inventory') setFlag('tutInventory');
  if (panel === 'map') setFlag('tutMap');
  if (panel === 'log') setFlag('logUnread', false);
}

export function closePanel() {
  if (state.ui.panel === 'none') return;
  setUI({ panel: 'none', paused: false });
}

export function togglePanel(panel: PanelId) {
  if (state.ui.panel === panel) closePanel();
  else openPanel(panel);
}

export function setPrompt(prompt: InteractPrompt | null) {
  const cur = state.ui.prompt;
  if (cur === prompt) return;
  if (
    cur &&
    prompt &&
    cur.id === prompt.id &&
    cur.label === prompt.label &&
    cur.enabled === prompt.enabled &&
    cur.detail === prompt.detail
  ) {
    return;
  }
  setUI({ prompt });
}

export function setCinematic(cinematic: string | null) {
  setUI({ cinematic });
}

/** Pins a map location as the active waypoint; null restores mission guidance. */
export function setWaypointOverride(id: string | null) {
  setUI({ waypointOverride: id });
}

/* ============================================================
   Inventory helpers
   ============================================================ */
export function countOf(id: ItemId, s: GameState = state) {
  return s.inventory[id] ?? 0;
}

export function hasItem(id: ItemId, s: GameState = state) {
  return countOf(id, s) > 0;
}

export function addItem(id: ItemId, qty = 1) {
  transient.newItems.add(id);
  setState((s) => ({
    inventory: { ...s.inventory, [id]: (s.inventory[id] ?? 0) + qty },
    stats: { ...s.stats, itemsFound: s.stats.itemsFound + qty },
  }));
}

export function removeItem(id: ItemId, qty = 1) {
  setState((s) => {
    const left = Math.max(0, (s.inventory[id] ?? 0) - qty);
    const inventory = { ...s.inventory };
    if (left === 0) delete inventory[id];
    else inventory[id] = left;
    return { inventory };
  });
}

export function setFlag(flag: string, value = true) {
  if (state.flags[flag] === value) return;
  setState((s) => ({ flags: { ...s.flags, [flag]: value } }));
}

export function discover(locationId: string) {
  if (state.discovered[locationId]) return false;
  setState((s) => ({ discovered: { ...s.discovered, [locationId]: true } }));
  return true;
}

export function adjustResources(patch: Partial<GameState['resources']>) {
  setState((s) => {
    const r = { ...s.resources };
    (Object.keys(patch) as (keyof GameState['resources'])[]).forEach((k) => {
      r[k] = Math.max(0, Math.min(100, r[k] + (patch[k] ?? 0)));
    });
    return { resources: r };
  });
}

export function setResources(patch: Partial<GameState['resources']>) {
  setState((s) => ({ resources: { ...s.resources, ...patch } }));
}
