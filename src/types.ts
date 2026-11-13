/**
 * NASA LAST MISSION — shared type definitions.
 */

export type Phase =
  | 'title'
  | 'intro'
  | 'name'
  | 'character'
  | 'crash'
  | 'playing'
  | 'ending';

export type CharacterId = 'male' | 'female';

export type ItemId =
  | 'oxygen_canister'
  | 'ration_pack'
  | 'repair_kit'
  | 'power_cell'
  | 'greenhouse_frame'
  | 'glass_panels'
  | 'water_recycler'
  | 'solar_panel'
  | 'planting_containers'
  | 'seed_vault'
  | 'comm_antenna'
  | 'potato'
  | 'lettuce'
  | 'tomato'
  | 'beans'
  | 'herbs'
  | 'wheat';

export type ItemCategory = 'survival' | 'component' | 'harvest';

export interface ItemDef {
  id: ItemId;
  name: string;
  category: ItemCategory;
  /** Short line shown under the item name in the inventory. */
  blurb: string;
  /** Real-world science note — the educational layer. */
  science?: string;
  /** Key for the generated icon renderer. */
  icon: string;
  stackable: boolean;
}

export type CropId = 'potato' | 'lettuce' | 'tomato' | 'beans' | 'herbs' | 'wheat';

export interface CropDef {
  id: CropId;
  name: string;
  /** Seconds of ideal conditions needed to reach 100% growth. */
  growSeconds: number;
  /** Water consumed per second of growth (percentage points). */
  waterUse: number;
  /** Ideal temperature in Celsius. */
  idealTemp: number;
  /** Tolerance band around the ideal temperature. */
  tempTolerance: number;
  yieldAmount: number;
  foodValue: number;
  color: number;
  blurb: string;
  science: string;
  unlockedFromStart: boolean;
}

export interface CropSlot {
  index: number;
  crop: CropId | null;
  /** 0-100 */
  growth: number;
  /** 0-100 — soil moisture. Also drives how dark the bed looks. */
  water: number;
  /** 0-100 */
  health: number;
  ready: boolean;
  /** Compost worked into the bed; spent at harvest. */
  fertilised: boolean;
}

export type SlotStage = 0 | 1 | 2 | 3 | 4;

export interface GreenhouseState {
  siteId: string | null;
  built: boolean;
  power: boolean;
  waterConnected: boolean;
  containersReady: boolean;
  /** Player-set target temperature, Celsius. */
  temperature: number;
  /** Player-set lamp output, 0-100. */
  light: number;
  /** Grow lamps for each row of beds, switched individually inside. */
  lightRows: boolean[];
  /** Water held in the watering can, 0-100. */
  wateringCan: number;
  /** True once the player has stepped inside at least once. */
  visited: boolean;
  /** Stored solar charge, 0-100. Drains under load, refills from the array. */
  charge: number;
  slots: CropSlot[];
  harvests: number;
  unlockedCrops: CropId[];
}

export interface LogEntry {
  id: number;
  speaker: string;
  lines: string[];
  sol: number;
}

export interface CodexEntry {
  id: string;
  title: string;
  body: string;
  sol: number;
}

export interface Resources {
  oxygen: number;
  water: number;
  food: number;
  energy: number;
}

export type ToastKind = 'info' | 'item' | 'success' | 'warning' | 'science';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  text?: string;
  /** Quiet footnote, so one toast can carry what used to take two. */
  note?: string;
  icon?: string;
  born: number;
  ttl: number;
}

export type DialogueTone = 'normal' | 'alert' | 'success';

export interface DialogueMessage {
  id: number;
  speaker: string;
  lines: string[];
  tone: DialogueTone;
  /** Optional science footnote displayed in the ARES NAV frame. */
  science?: string;
}

export type PanelId =
  | 'none'
  | 'inventory'
  | 'map'
  | 'nav'
  | 'pause'
  | 'settings'
  | 'greenhouse'
  | 'build'
  | 'codex'
  | 'log'
  | 'seeds';

export interface InteractPrompt {
  id: string;
  label: string;
  /** Secondary line, e.g. a requirement that is not met yet. */
  detail?: string;
  enabled: boolean;
}

export type TextSpeed = 'relaxed' | 'normal' | 'fast';

export interface Settings {
  master: number;
  music: number;
  sfx: number;
  showWaypointArrow: boolean;
  showHints: boolean;
  screenShake: boolean;
  /** Dials every decorative animation down for motion sensitivity. */
  reduceMotion: boolean;
  /** Typewriter pace for dialogue. */
  textSpeed: TextSpeed;
  /** Multiplier applied to the whole HUD, 0.85 - 1.25. */
  uiScale: number;
  /** Swaps resource colours for a deuteranopia-friendly set. */
  colorblind: boolean;
  /** When false the game never writes a save to this browser. */
  saveProgress: boolean;
}

export interface MissionDef {
  id: string;
  code: string;
  title: string;
  /** ARES NAV lines spoken when the mission starts. */
  brief: string[];
  /** Short objective text for the HUD. */
  objective: string;
  /** Longer hint, available on demand. */
  hint: string;
  /** Location id the waypoint should point at (may be resolved dynamically). */
  waypoint?: string | null;
  /** Overrides the static objective line, e.g. to show a running count. */
  objectiveOf?: (s: GameState) => string;
  /** Resolves the live waypoint target id. */
  waypointOf?: (s: GameState) => string | null;
  /** Optional progress counter rendered as a small bar. */
  progressOf?: (s: GameState) => { have: number; need: number } | null;
  isComplete: (s: GameState) => boolean;
  /** ARES NAV lines spoken on completion. */
  done: string[];
  science?: string;
}

export interface GameState {
  phase: Phase;
  playerName: string;
  character: CharacterId;

  /** Martian day counter, starts at 1. */
  sol: number;
  /** Fraction of the current sol, 0 = sol start, 0.5 = midday. */
  solTime: number;
  /** Total seconds of gameplay. */
  elapsed: number;

  resources: Resources;
  inventory: Partial<Record<ItemId, number>>;
  /** Ids of world interactables that have been consumed. */
  collected: Record<string, boolean>;
  /** Discovered map locations. */
  discovered: Record<string, boolean>;

  missionIndex: number;
  completedMissions: string[];

  greenhouse: GreenhouseState;
  /** The surface truck: where it is parked, and whether it runs yet. */
  rover: { x: number; y: number; fixed: boolean };
  flags: Record<string, boolean>;
  /** Science notes unlocked through play — the mission science log. */
  codex: CodexEntry[];
  /** Everything ARES NAV has said, newest last. */
  dialogueLog: LogEntry[];

  /** Mirrored from the live Phaser position; used for saving and the map. */
  playerX: number;
  playerY: number;

  settings: Settings;

  ui: {
    panel: PanelId;
    prompt: InteractPrompt | null;
    dialogue: DialogueMessage[];
    toasts: Toast[];
    /** Non-null while a scripted in-game moment is playing. */
    cinematic: string | null;
    /** Location or pickup id pinned from the map, overriding the mission target. */
    waypointOverride: string | null;
    paused: boolean;
    blackout: boolean;
  };

  stats: {
    itemsFound: number;
    metresWalked: number;
    startedAt: number;
  };
}

export interface SavePayload {
  version: number;
  savedAt: number;
  state: Omit<GameState, 'ui'> & { ui?: never };
  fog: string;
}
