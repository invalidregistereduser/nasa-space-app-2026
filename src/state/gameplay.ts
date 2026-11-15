import type { CropId, GameState, ItemId } from '../types';
import {
  BUILD_REQUIREMENTS,
  BUILD_SITE_BY_ID,
  LOCATIONS,
  PICKUP_BY_ID,
  SOL_SECONDS,
  TRANSMITTER_REQUIREMENTS,
} from '../game/constants';
import { bus } from '../game/bus';
import { sfx, audio } from '../audio/AudioEngine';
import { daylight } from '../util/time';
import { CROPS, ITEMS } from './items';
import { MISSIONS } from './missions';
import { live } from './live';
import { resetThoughts, thought, tickThoughts } from './thoughts';
import { deliverTransmissions } from './transmissions';
import {
  addItem,
  adjustResources,
  closePanel,
  discover,
  getState,
  hasItem,
  learn,
  openPanel,
  removeItem,
  say,
  setFlag,
  setState,
  setUI,
  showMissionTick,
  toast,
} from './store';
import { saveGame } from './save';

/* ============================================================
   Balance constants — deliberately forgiving for a first demo
   ============================================================ */
const O2_DRAIN = 0.142;
const ROVER_O2_RELIEF = 0.25;
const O2_RUN_EXTRA = 0.075;
const O2_SHELTER_REFILL = 9;
const WATER_DRAIN = 0.042;
const WATER_SHELTER_REFILL = 5;
const FOOD_DRAIN = 0.03;
const ENERGY_DRAIN = 0.028;
const ENERGY_SHELTER_REFILL = 6;
const ENERGY_SOLAR_TRICKLE = 0.05;

const CANISTER_OXYGEN = 40;
const WATER_PER_POUR = 5;
const RECYCLER_RECOVERY = 0.7;

let accumulator = 0;
let lastX = 0;
let lastY = 0;
let autosaveTimer = 0;
let missionIdleSeconds = 0;
let lastMissionIndex = -1;

export function resetTickState() {
  accumulator = 0;
  lastX = getState().playerX;
  lastY = getState().playerY;
  autosaveTimer = 0;
  missionIdleSeconds = 0;
  lastMissionIndex = -1;
}

/** If an objective stalls, ARES NAV volunteers its hint rather than leaving you stuck. */
function checkStalled(dt: number) {
  const s = getState();
  if (s.missionIndex !== lastMissionIndex) {
    lastMissionIndex = s.missionIndex;
    missionIdleSeconds = 0;
    return;
  }
  if (!s.settings.showHints || s.ui.dialogue.length) return;
  missionIdleSeconds += dt;
  if (missionIdleSeconds < 75) return;
  missionIdleSeconds = 0;
  const mission = MISSIONS[s.missionIndex];
  if (!mission) return;
  say([mission.hint], { key: `stall-${mission.id}` });
}

/* ============================================================
   Main simulation tick — driven by the Phaser update loop
   ============================================================ */
export function tickWorld(deltaMs: number) {
  const s = getState();
  if (s.phase !== 'playing' || s.ui.paused || s.ui.blackout) return;

  accumulator += deltaMs / 1000;
  if (accumulator < 0.2) return;
  const dt = Math.min(accumulator, 1.5);
  accumulator = 0;

  const sheltered = live.sheltered;
  const resources = { ...s.resources };

  /* --- Suit resources ------------------------------------- */
  if (sheltered) {
    resources.oxygen = Math.min(100, resources.oxygen + O2_SHELTER_REFILL * dt);
    resources.water = Math.min(100, resources.water + WATER_SHELTER_REFILL * dt);
    resources.energy = Math.min(100, resources.energy + ENERGY_SHELTER_REFILL * dt);
  } else {
    const run = live.running && live.moving ? O2_RUN_EXTRA : 0;
    // The truck cab holds pressure, so the suit tank barely ticks down in it.
    const cab = live.riding ? ROVER_O2_RELIEF : 1;
    resources.oxygen = Math.max(0, resources.oxygen - (O2_DRAIN + run) * cab * dt);
    resources.water = Math.max(0, resources.water - WATER_DRAIN * dt);
    resources.energy = Math.max(
      0,
      resources.energy -
        ENERGY_DRAIN * dt +
        (hasItem('solar_panel', s) ? ENERGY_SOLAR_TRICKLE * daylight(s.solTime) * dt : 0),
    );
  }
  resources.food = Math.max(0, resources.food - FOOD_DRAIN * dt);

  /* --- Sol clock ------------------------------------------ */
  let solTime = s.solTime + dt / SOL_SECONDS;
  let sol = s.sol;
  if (solTime >= 1) {
    solTime -= 1;
    sol += 1;
    bus.emit('time:sol', { sol });
    toast({ kind: 'info', title: `Sol ${sol}`, ttl: 3000 });
  }

  /* --- Greenhouse ----------------------------------------- */
  const greenhouse = { ...s.greenhouse, slots: s.greenhouse.slots.map((slot) => ({ ...slot })) };
  if (greenhouse.built) {
    const sun = daylight(solTime);
    const draw = greenhouse.power ? 0.1 + greenhouse.light * 0.001 : 0.012;
    greenhouse.charge = Math.max(0, Math.min(100, greenhouse.charge + (sun * 0.95 - draw) * dt));
    if (greenhouse.power && greenhouse.charge <= 0.4) {
      greenhouse.power = false;
      say(
        [
          'Warning — the greenhouse battery is flat and life support to the trays has tripped offline.',
          'The array will refill it shortly, {name}. Nothing is lost.',
        ],
        { tone: 'alert', key: 'power-trip' },
      );
      sfx('warn');
    }

    const growthMultiplier = greenhouse.power ? 1 : 0;
    for (const slot of greenhouse.slots) {
      if (!slot.crop || slot.ready) continue;
      const def = CROPS[slot.crop];
      // Beds dry out even when the lamps are off, just more slowly.
      slot.water = Math.max(0, slot.water - def.waterUse * dt * (growthMultiplier ? 1 : 0.35));

      const row = Math.floor(slot.index / 2);
      const lampOn = greenhouse.lightRows[row] ?? true;
      const tempOff = Math.abs(greenhouse.temperature - def.idealTemp);
      const tempFactor = Math.max(0, 1 - tempOff / (def.tempTolerance * 1.6));
      const lightFactor = lampOn ? Math.min(1, greenhouse.light / 70) : 0.1;
      const waterFactor = slot.water > 30 ? 1 : slot.water / 30;
      const compost = slot.fertilised ? 1.35 : 1;

      const rate =
        (100 / def.growSeconds) * tempFactor * lightFactor * waterFactor * compost * growthMultiplier;
      slot.growth = Math.min(100, slot.growth + rate * dt);

      if (slot.water <= 0 && growthMultiplier) {
        slot.health = Math.max(15, slot.health - 1.6 * dt);
      } else if (tempFactor > 0.5 && waterFactor > 0.5) {
        slot.health = Math.min(100, slot.health + 0.8 * dt);
      }

      if (slot.growth >= 100 && !slot.ready) {
        slot.ready = true;
        sfx('objective');
        toast({ kind: 'success', title: `${def.name} is ready`, ttl: 4000 });
        bus.emit('world:crop-stage', { stage: 4 });
      }
    }
  }

  /* --- Distance travelled --------------------------------- */
  const dx = live.x - lastX;
  const dy = live.y - lastY;
  const stepped = Math.hypot(dx, dy);
  lastX = live.x;
  lastY = live.y;

  setState({
    resources,
    solTime,
    sol,
    greenhouse,
    elapsed: s.elapsed + dt,
    playerX: live.x || s.playerX,
    playerY: live.y || s.playerY,
    stats: {
      ...s.stats,
      metresWalked: s.stats.metresWalked + (stepped < 300 ? stepped / 14 : 0),
    },
  });

  checkWarnings();
  checkMissions();
  checkStalled(dt);
  tickThoughts(dt, live.moving);

  autosaveTimer += dt;
  if (autosaveTimer > 25) {
    autosaveTimer = 0;
    saveGame();
  }
}

/* ============================================================
   Survival warnings and blackout
   ============================================================ */
function checkWarnings() {
  const s = getState();
  const o2 = s.resources.oxygen;

  if (o2 > 55) {
    if (s.flags.warnO2a || s.flags.warnO2b) {
      setState((st) => ({ flags: { ...st.flags, warnO2a: false, warnO2b: false } }));
    }
  }

  if (o2 <= 32 && o2 > 14 && !s.flags.warnO2a) {
    setFlag('warnO2a');
    sfx('warn');
    say(['Oxygen low. Shelter, or a canister.'], {
      tone: 'alert',
      urgent: true,
    });
  } else if (o2 <= 14 && !s.flags.warnO2b) {
    setFlag('warnO2b');
    sfx('alarm');
    say(['Oxygen critical. Move.'], {
      tone: 'alert',
      urgent: true,
    });
  }

  if (o2 <= 0 && !s.ui.blackout) {
    triggerBlackout();
  }

  if (s.resources.food <= 12 && !s.flags.warnFood) {
    setFlag('warnFood');
    say(['You need to eat. Rations are in your pack.'], {
      tone: 'alert',
    });
  }
  if (s.resources.water <= 12 && !s.flags.warnWater) {
    setFlag('warnWater');
    say(['Water is low. The shelter refills it.'], {
      tone: 'alert',
    });
  }

  // A gentle nudge when the beds are drying out.
  const thirsty = s.greenhouse.slots.filter((slot) => slot.crop && slot.water < 25).length;
  if (thirsty > 0 && !s.flags.warnThirsty) {
    setFlag('warnThirsty');
    toast({ kind: 'warning', title: `${thirsty} bed${thirsty > 1 ? 's' : ''} need water`, ttl: 4000 });
  } else if (thirsty === 0 && s.flags.warnThirsty) {
    setFlag('warnThirsty', false);
  }
}

function triggerBlackout() {
  setUI({ blackout: true, panel: 'none' });
  sfx('alarm');
  bus.emit('player:blackout');
  window.setTimeout(() => {
    adjustResources({ oxygen: 48, water: 8, energy: 25 });
    setState((s) => ({ flags: { ...s.flags, warnO2a: false, warnO2b: false } }));
    setUI({ blackout: false });
    bus.emit('player:recovered');
    say(
      [
        'Your suit put you into emergency hibernation and the shelter beacon walked you home.',
        'You lost time, {name}. Not your life. Keep a canister spare from now on.',
      ],
      { tone: 'alert' },
    );
  }, 3400);
}

/* ============================================================
   Missions
   ============================================================ */
/** Reminds a returning player what they were in the middle of. */
function remindMission(index: number) {
  const mission = MISSIONS[index];
  if (!mission) return;
  say(mission.brief, { key: `brief-${mission.id}` });
  bus.emit('nav:waypoint', { id: mission.waypoint ?? null });
}

/**
 * Moves on to the next mission if the current one is done, and says so with
 * a tick. Returns true when that happened, so the caller knows not to put a
 * message of its own on top of it.
 */
export function checkMissions(): boolean {
  const s = getState();
  if (s.phase !== 'playing') return false;
  const mission = MISSIONS[s.missionIndex];
  if (!mission || !mission.isComplete(s)) return false;

  const nextIndex = s.missionIndex + 1;
  setState({
    missionIndex: nextIndex,
    completedMissions: [...s.completedMissions, mission.id],
  });
  if (mission.science) {
    learn(`mission_${mission.id}`, mission.title, mission.science);
  }

  showMissionTick();
  sfx('objective');
  audio.swell();
  bus.emit('camera:focus', { zoom: 1.08, hold: 500 });
  bus.emit('nav:waypoint', { id: MISSIONS[nextIndex]?.waypoint ?? null });

  deliverTransmissions(nextIndex);
  saveGame();
  return true;
}

/* ============================================================
   World interactions
   ============================================================ */
export function collectPickup(id: string) {
  const s = getState();
  const def = PICKUP_BY_ID[id];
  if (!def || s.collected[id]) return;

  setState({ collected: { ...s.collected, [id]: true } });
  (Object.keys(def.grants) as ItemId[]).forEach((item) => {
    const qty = def.grants[item] ?? 0;
    if (qty > 0) addItem(item, qty);
  });

  sfx('collect');
  bus.emit('world:collect', { id });
  if (def.science) learn(`pickup_${id}`, def.label, def.science);
  checkMissions();
  saveGame();
}

/** Welds the old survey rover back into a working truck. Costs the repair kit. */
export function repairRover() {
  const s = getState();
  if (s.rover.fixed) return;
  if (!hasItem('repair_kit')) {
    toast({ kind: 'warning', title: 'Needs a repair kit', ttl: 3200 });
    return;
  }
  removeItem('repair_kit', 1);
  setState({ rover: { ...s.rover, fixed: true } });
  sfx('build');
  learn(
    'rover_drive',
    'Pressurised rover',
    'NASA studies crewed rovers as mobile habitats: a pressurised cab lets astronauts drive for days without burning suit consumables, and extends a sortie from hundreds of metres to tens of kilometres.',
  );
  say(['It runs. Faster than walking, and the cab holds pressure.'], { key: 'rover-fixed' });
  saveGame();
}

/** Climbs in or out. The truck stays wherever it was parked. */
export function toggleRover(x: number, y: number) {
  const s = getState();
  if (!s.rover.fixed) return false;
  const boarding = !live.riding;
  if (boarding) {
    sfx('airlock');
    thought('board');
  } else {
    setState({ rover: { ...s.rover, x, y } });
    sfx('airlock');
    saveGame();
  }
  return boarding;
}

export function inspectRover() {
  if (getState().flags.roverSurveyed) {
    say(['Already read. It is on your map.'], { key: 'rover-again' });
    return;
  }
  setFlag('roverSurveyed');
  sfx('discover');
  LOCATIONS.forEach((l) => discover(l.id));
  learn(
    'rover_survey',
    'Rover survey',
    'Rovers map terrain with stereo cameras and laser rangefinders, building the elevation models that mission planners use to pick safe routes.',
  );
  // Read early, before ARES asks for it, the survey still deserves a word.
  if (!checkMissions()) toast({ kind: 'success', title: 'Debris field plotted', ttl: 3400 });
  saveGame();
}

export function replenishAtShelter() {
  const s = getState();
  const topped = s.resources.oxygen < 99 || s.resources.water < 99 || s.resources.energy < 99;
  setState({ resources: { ...s.resources, oxygen: 100, water: 100, energy: 100 } });
  setState((st) => ({ flags: { ...st.flags, warnO2a: false, warnO2b: false, warnWater: false } }));
  bus.emit('world:refill');
  sfx('power');
  if (s.flags.usedShelter) {
    toast({ kind: 'success', title: topped ? 'Suit topped up' : 'Already full', ttl: 2800 });
  } else {
    setFlag('usedShelter');
    say(
      [
        'The shelter scrubbers are still working. Oxygen, water and power restored.',
        'Come back here whenever your gauges run low, {name}.',
      ],
      { key: 'shelter-first' },
    );
    learn(
      'shelter',
      'Pressurised shelter',
      'A Mars habitat recycles its air chemically: carbon dioxide is scrubbed out and oxygen is generated by splitting water with electricity.',
    );
  }
  saveGame();
}

export function selectBuildSite(siteId: string) {
  const site = BUILD_SITE_BY_ID[siteId];
  if (!site) return;
  setState((s) => ({ greenhouse: { ...s.greenhouse, siteId } }));
  sfx('ui_click');
  if (!checkMissions()) toast({ kind: 'success', title: `Site set: ${site.name}`, ttl: 3000 });
  saveGame();
}

export function canBuildGreenhouse(s: GameState = getState()) {
  return BUILD_REQUIREMENTS.every((r) => hasItem(r.id, s));
}

export function buildGreenhouse() {
  const s = getState();
  if (!s.greenhouse.siteId || s.greenhouse.built || !canBuildGreenhouse(s)) return;

  ['greenhouse_frame', 'glass_panels', 'planting_containers'].forEach((id) =>
    removeItem(id as ItemId, 1),
  );

  setState((st) => ({
    greenhouse: { ...st.greenhouse, built: true, charge: 62 },
  }));
  closePanel();
  bus.emit('world:build-start', { siteId: s.greenhouse.siteId });
  sfx('build');
  audio.swell();
  learn(
    'greenhouse',
    'Pressurised agriculture',
    'A Mars greenhouse is a pressure vessel first and a garden second: it holds about one bar of air against a near-vacuum, filters UV, and keeps a stable temperature through a 100 °C daily swing.',
  );
  checkMissions();
  thought('greenhouseBuilt');
  saveGame();
}

/* ============================================================
   Greenhouse systems
   ============================================================ */
export function ghActivatePower() {
  const s = getState();
  if (!s.greenhouse.built || s.greenhouse.power) return;
  if (s.greenhouse.charge < 4) {
    toast({ kind: 'warning', title: 'Not enough charge', ttl: 3000 });
    return;
  }
  setState((st) => ({ greenhouse: { ...st.greenhouse, power: true } }));
  sfx('power');
  bus.emit('world:build-stage', { stage: 4 });
  const advanced = checkMissions();
  if (!s.flags.ghPowered) {
    setFlag('ghPowered');
    if (!advanced) say(['Power up. Lamps are on the battery.'], { key: 'gh-power' });
    learn(
      'solar',
      'Power on Mars',
      'Sunlight at Mars delivers roughly 590 W/m² at the top of the atmosphere against 1361 W/m² at Earth, so arrays are oversized and paired with batteries for the night.',
    );
  }
  saveGame();
}

export function ghTogglePower() {
  const s = getState();
  if (!s.greenhouse.built) return;
  if (s.greenhouse.power) {
    setState((st) => ({ greenhouse: { ...st.greenhouse, power: false } }));
    sfx('ui_close');
  } else {
    ghActivatePower();
  }
}

export function ghConnectWater() {
  const s = getState();
  if (!s.greenhouse.built || s.greenhouse.waterConnected) return;
  if (!hasItem('water_recycler', s)) {
    toast({ kind: 'warning', title: 'Water recycler missing', ttl: 3200 });
    return;
  }
  removeItem('water_recycler', 1);
  setState((st) => ({ greenhouse: { ...st.greenhouse, waterConnected: true } }));
  sfx('water');
  learn(
    'water_loop',
    'Closing the water loop',
    'Plants transpire almost all the water they are given. A condenser above the canopy recovers it, which is why a sealed greenhouse uses a fraction of the water an open field would.',
  );
  if (!checkMissions()) say(['Water loop closed. Nothing is wasted.'], { key: 'gh-water' });
  saveGame();
}

export function ghPrepareTrays() {
  const s = getState();
  if (!s.greenhouse.built || s.greenhouse.containersReady) return;
  if (!s.greenhouse.power) {
    toast({ kind: 'warning', title: 'Needs power first', ttl: 3000 });
    return;
  }
  setState((st) => ({ greenhouse: { ...st.greenhouse, containersReady: true } }));
  sfx('plant');
  learn(
    'perchlorate',
    'Washing the regolith',
    'Martian soil holds roughly 0.5-1% perchlorate salts, which are toxic to humans and most plants. Rinsing with water and biological treatment is the leading plan to make it usable.',
  );
  if (!checkMissions()) {
    say(['Trays ready. It is not Earth soil, {name}, but it will hold a root.'], {
      key: 'gh-trays',
    });
  }
  saveGame();
}

export function ghPlant(slotIndex: number, crop: CropId) {
  const s = getState();
  const gh = s.greenhouse;
  if (!gh.built || !gh.containersReady) {
    toast({ kind: 'warning', title: 'Prepare the trays first', ttl: 3200 });
    return;
  }
  if (!hasItem('seed_vault', s)) {
    toast({ kind: 'warning', title: 'Seed vault missing', ttl: 3200 });
    return;
  }
  const slot = gh.slots[slotIndex];
  if (!slot || slot.crop) return;

  const slots = gh.slots.map((sl) =>
    sl.index === slotIndex
      ? { ...sl, crop, growth: 0, water: Math.max(55, sl.water), health: 100, ready: false }
      : sl,
  );
  setState({ greenhouse: { ...gh, slots } });
  sfx('plant');
  bus.emit('gh:planted', { slot: slotIndex });
  bus.emit('world:crop-stage', { stage: 1 });
  learn(`crop_${crop}`, CROPS[crop].name, CROPS[crop].science);
  const veryFirst = gh.harvests === 0 && !gh.slots.some((sl) => sl.crop);
  if (!checkMissions() && !veryFirst) {
    toast({ kind: 'success', title: `${CROPS[crop].name} planted`, ttl: 2600 });
  }
  if (veryFirst) thought('firstPlant');
  saveGame();
}

/** Fills the watering can from the tank. Draws on the colony water supply. */
export function ghRefillCan() {
  const s = getState();
  const gh = s.greenhouse;
  if (!gh.waterConnected) {
    toast({ kind: 'warning', title: 'The tank is not connected yet', ttl: 3400 });
    return;
  }
  if (gh.wateringCan >= 99) {
    toast({ kind: 'info', title: 'The can is already full', ttl: 2400 });
    return;
  }
  if (s.resources.water < WATER_PER_POUR) {
    toast({ kind: 'warning', title: 'Water is low', ttl: 3000 });
    return;
  }
  setState({ greenhouse: { ...gh, wateringCan: 100 } });
  adjustResources({ water: -WATER_PER_POUR * (1 - RECYCLER_RECOVERY) });
  sfx('water');
  if (!s.flags.tutWater) {
    setFlag('tutWater');
    toast({ kind: 'info', title: 'Can filled', ttl: 2600 });
  }
}

/** Pours the can over one bed. */
export function ghWaterBed(slotIndex: number) {
  const s = getState();
  const gh = s.greenhouse;
  const slot = gh.slots[slotIndex];
  if (!slot) return;
  if (gh.wateringCan < 20) {
    toast({ kind: 'warning', title: 'The can is empty', ttl: 3000 });
    sfx('warn');
    return;
  }
  if (slot.water >= 98) {
    toast({ kind: 'info', title: 'That bed is already soaked', ttl: 2200 });
    return;
  }
  const slots = gh.slots.map((sl) =>
    sl.index === slotIndex ? { ...sl, water: Math.min(100, sl.water + 45) } : sl,
  );
  setState({
    greenhouse: { ...gh, slots, wateringCan: Math.max(0, gh.wateringCan - 20) },
  });
  sfx('water');
  bus.emit('gh:watered', { slot: slotIndex });
}

/** Switches one row of grow lamps. */
export function ghToggleRow(row: number) {
  const gh = getState().greenhouse;
  const lightRows = gh.lightRows.map((on, i) => (i === row ? !on : on));
  setState({ greenhouse: { ...gh, lightRows } });
  sfx(lightRows[row] ? 'power' : 'ui_close');
}

/** Works compost into a bed, speeding the next grow. */
export function ghFertilise(slotIndex: number) {
  const gh = getState().greenhouse;
  const slot = gh.slots[slotIndex];
  if (!slot || slot.fertilised) return;
  const slots = gh.slots.map((sl) => (sl.index === slotIndex ? { ...sl, fertilised: true } : sl));
  setState({ greenhouse: { ...gh, slots } });
  sfx('plant');
  toast({ kind: 'success', title: 'Compost worked in', text: 'This bed will grow faster.', ttl: 3200 });
  learn(
    'compost',
    'Closing the nutrient loop',
    'Inedible plant matter, packaging and crew waste are composted back into growing medium — on Mars nothing is thrown away, because nothing can be replaced.',
  );
}

export function ghSetTemperature(value: number) {
  setState((s) => ({
    greenhouse: { ...s.greenhouse, temperature: Math.round(Math.max(2, Math.min(32, value))) },
  }));
}

export function ghSetLight(value: number) {
  setState((s) => ({
    greenhouse: { ...s.greenhouse, light: Math.round(Math.max(0, Math.min(100, value))) },
  }));
}

export function ghHarvest(slotIndex: number) {
  const s = getState();
  const gh = s.greenhouse;
  const slot = gh.slots[slotIndex];
  if (!slot?.crop || !slot.ready) return;

  const def = CROPS[slot.crop];
  const quality = slot.health / 100;
  const amount = Math.max(1, Math.round(def.yieldAmount * (0.6 + quality * 0.4)));
  addItem(slot.crop as ItemId, amount);

  const unlocked = [...gh.unlockedCrops];
  if (gh.harvests === 0) {
    (['lettuce', 'tomato', 'beans', 'herbs', 'wheat'] as CropId[]).forEach((c) => {
      if (!unlocked.includes(c)) unlocked.push(c);
    });
  }

  // The bed keeps its moisture; the compost is used up by the crop.
  const slots = gh.slots.map((sl) =>
    sl.index === slotIndex
      ? { ...sl, crop: null, growth: 0, health: 100, ready: false, fertilised: false }
      : sl,
  );
  setState({
    greenhouse: { ...gh, slots, harvests: gh.harvests + 1, unlockedCrops: unlocked },
  });
  sfx('harvest');
  audio.swell();
  bus.emit('gh:harvested', { slot: slotIndex });
  bus.emit('camera:focus', { zoom: 1.14, hold: 700 });
  bus.emit('world:crop-stage', { stage: 0 });
  const first = gh.harvests === 0;
  if (!checkMissions()) {
    toast({
      kind: 'success',
      title: `Harvested ${def.name} ×${amount}`,
      text: first ? 'New seeds on the shelf' : undefined,
      ttl: first ? 4200 : 3000,
    });
  }
  if (first) thought('firstHarvest');
  saveGame();
}

/** What a bed is doing right now — drives the hover card inside the greenhouse. */
export function bedForecast(slotIndex: number) {
  const gh = getState().greenhouse;
  const slot = gh.slots[slotIndex];
  if (!slot?.crop) return null;
  const def = CROPS[slot.crop];
  const row = Math.floor(slot.index / 2);
  const lampOn = gh.lightRows[row] ?? true;
  const tempOff = Math.abs(gh.temperature - def.idealTemp);
  const tempFactor = Math.max(0, 1 - tempOff / (def.tempTolerance * 1.6));
  const lightFactor = lampOn ? Math.min(1, gh.light / 70) : 0.1;
  const waterFactor = slot.water > 30 ? 1 : slot.water / 30;
  const compost = slot.fertilised ? 1.35 : 1;
  const rate =
    (100 / def.growSeconds) * tempFactor * lightFactor * waterFactor * compost * (gh.power ? 1 : 0);
  const secondsLeft = rate > 0.0008 ? (100 - slot.growth) / rate : Infinity;

  let status: string;
  if (slot.ready) status = 'Ready to pick';
  else if (!gh.power) status = 'Waiting on power';
  else if (waterFactor < 0.6) status = 'Thirsty';
  else if (!lampOn) status = 'In the dark';
  else if (tempFactor < 0.5) status = gh.temperature < def.idealTemp ? 'Too cold' : 'Too warm';
  else if (slot.health < 60) status = 'Recovering';
  else status = 'Thriving';

  return { def, slot, rate, secondsLeft, status, lampOn, compost: slot.fertilised };
}

/* ============================================================
   Inventory use
   ============================================================ */
export function useItem(id: ItemId) {
  const s = getState();
  if ((s.inventory[id] ?? 0) <= 0) return;

  switch (id) {
    case 'oxygen_canister':
      removeItem(id, 1);
      adjustResources({ oxygen: CANISTER_OXYGEN });
      setState((st) => ({ flags: { ...st.flags, warnO2a: false, warnO2b: false } }));
      sfx('power');
      toast({ kind: 'success', title: 'Oxygen replenished', text: `+${CANISTER_OXYGEN}% O₂`, ttl: 3400 });
      break;
    case 'ration_pack':
      removeItem(id, 1);
      adjustResources({ food: 30 });
      setFlag('warnFood', false);
      sfx('collect');
      toast({ kind: 'success', title: 'Ration consumed', text: '+30% nutrition', ttl: 3400 });
      break;
    case 'potato':
    case 'lettuce':
    case 'wheat': {
      removeItem(id, 1);
      const value = CROPS[id as CropId].foodValue;
      adjustResources({ food: value });
      setFlag('warnFood', false);
      sfx('collect');
      toast({
        kind: 'success',
        title: `Ate ${ITEMS[id].name}`,
        text: `+${value}% nutrition · grown on Mars`,
        ttl: 3800,
      });
      break;
    }
    default:
      toast({ kind: 'info', title: ITEMS[id].name, text: 'Mission component — keep it safe.', ttl: 3000 });
  }
}

/* ============================================================
   Endgame
   ============================================================ */
export function canRepairTransmitter(s: GameState = getState()) {
  return TRANSMITTER_REQUIREMENTS.every((r) => hasItem(r.id, s));
}

export function repairTransmitter() {
  const s = getState();
  if (!canRepairTransmitter(s) || s.flags.transmitted) return;
  TRANSMITTER_REQUIREMENTS.forEach((r) => removeItem(r.id, 1));
  setFlag('transmitted');
  closePanel();
  sfx('transmit');
  audio.swell();
  bus.emit('world:transmit');
  learn(
    'comms',
    'Talking to Earth',
    'A signal from Mars takes 5 to 20 minutes to reach Earth. Real-time conversation is impossible — crews send messages and wait.',
  );
  checkMissions();
  thought('transmit');
  saveGame();
  window.setTimeout(() => {
    setState({ phase: 'ending' });
    audio.setExposure(false);
  }, 4200);
}

/* ============================================================
   Session control
   ============================================================ */
export function beginPlaying() {
  setState({ phase: 'playing' });
  resetTickState();
  resetThoughts();
  audio.unlock();
  audio.startAmbient();
  const s = getState();
  // A fresh run starts in silence: the astronaut has only just opened their
  // eyes. Somebody coming back to a save gets one line on where they were.
  const returning = s.missionIndex > 0 || s.elapsed > 0;
  if (returning) window.setTimeout(() => remindMission(s.missionIndex), 1200);
}

export function openGreenhousePanel() {
  openPanel('greenhouse');
  sfx('ui_open');
}
