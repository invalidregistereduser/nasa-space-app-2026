import type { GameState, MissionDef } from '../types';
import { BUILD_REQUIREMENTS, PICKUPS } from '../game/constants';

const have = (s: GameState, id: keyof GameState['inventory']) => (s.inventory[id] ?? 0) > 0;

function componentsHeld(s: GameState) {
  return BUILD_REQUIREMENTS.filter((r) => have(s, r.id)).length;
}

/** The nearest greenhouse component the player has not collected yet. */
function nearestMissingComponent(s: GameState): string | null {
  const needed = new Set(BUILD_REQUIREMENTS.filter((r) => !have(s, r.id)).map((r) => r.id));
  let best: string | null = null;
  let bestDist = Infinity;
  for (const p of PICKUPS) {
    if (s.collected[p.id]) continue;
    const grantsNeeded = Object.keys(p.grants).some((g) => needed.has(g as never));
    if (!grantsNeeded) continue;
    const d = (p.x - s.playerX) ** 2 + (p.y - s.playerY) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = p.id;
    }
  }
  return best;
}

export const MISSIONS: MissionDef[] = [
  {
    id: 'm_awaken',
    code: 'MISSION 01',
    title: 'SYSTEMS CHECK',
    brief: [
      '{name}. I am ARES NAV, your suit.',
      'The ship is down and Earth is silent. Get up and walk — WASD.',
    ],
    objective: 'Walk, using WASD',
    hint: 'WASD or the arrow keys walk. SHIFT runs, and burns oxygen faster.',
    waypoint: null,
    isComplete: (s) => !!s.flags.hasMoved,
    science: 'A Martian day — a sol — lasts 24 hours, 39 minutes and 35 seconds.',
  },
  {
    id: 'm_supplies',
    code: 'MISSION 02',
    title: 'RECOVER EMERGENCY SUPPLIES',
    brief: ['Supply box near the wreck. Walk to the marker.'],
    objective: 'Reach the supply box',
    hint: 'Follow the arrow. Walking onto it picks it up.',
    waypoint: 'supply_box',
    isComplete: (s) => !!s.collected.supply_box,
  },
  {
    id: 'm_rover',
    code: 'MISSION 03',
    title: 'INSPECT THE EXPEDITION ROVER',
    brief: ['The rover sent one last survey before it died. North-west.'],
    objective: 'Read the rover survey log',
    hint: 'North-west. Press E at the rover.',
    waypoint: 'rover_station',
    isComplete: (s) => !!s.flags.roverSurveyed,
    science: "Mars' gravity is 38% of Earth's, so a crate that weighed 100 kg on the launch pad handles like 38 kg here.",
  },
  {
    id: 'm_components',
    code: 'MISSION 04',
    title: 'RECOVER GREENHOUSE COMPONENTS',
    brief: ['Nothing grows in this air. Fetch the six parts — I will point at the nearest.'],
    objective: 'Collect the six components',
    objectiveOf: (s) => `Collect the six components (${componentsHeld(s)}/6)`,
    hint: 'Follow the arrow. Walk onto each part to take it.',
    waypointOf: nearestMissingComponent,
    progressOf: (s) => ({ have: componentsHeld(s), need: 6 }),
    isComplete: (s) => componentsHeld(s) === 6,
  },
  {
    id: 'm_site',
    code: 'MISSION 05',
    title: 'CHOOSE A CONSTRUCTION SITE',
    brief: ['Three pads on the flats. Stand on one, press E. Your call.'],
    objective: 'Choose a site on the flats',
    hint: 'Stand on a glowing pad and press E.',
    waypoint: 'build_flats',
    isComplete: (s) => s.greenhouse.siteId !== null,
  },
  {
    id: 'm_build',
    code: 'MISSION 06',
    title: 'CONSTRUCT THE GREENHOUSE',
    brief: ['Press E at your site and I will walk you through the build.'],
    objective: 'Build the greenhouse',
    hint: 'Back to your pad, press E. You carry everything it needs.',
    waypointOf: (s) => s.greenhouse.siteId,
    isComplete: (s) => s.greenhouse.built,
    science:
      'A pressurised habitat must hold about one bar against near-vacuum outside — a load comparable to 10 metres of water pressing outward.',
  },
  {
    id: 'm_systems',
    code: 'MISSION 07',
    title: 'BRING THE GREENHOUSE ONLINE',
    brief: ['Go in — press E at the door. Breaker, then tank, then the beds.'],
    objective: 'Go inside and bring the greenhouse up',
    hint: 'Breaker on the back wall, tank on the left, beds in the middle. Press E at each.',
    waypointOf: (s) => s.greenhouse.siteId,
    isComplete: (s) =>
      s.greenhouse.power && s.greenhouse.waterConnected && s.greenhouse.containersReady,
    science:
      'Martian regolith contains perchlorate salts that are toxic to humans, so growth media must be washed or manufactured before planting.',
  },
  {
    id: 'm_plant',
    code: 'MISSION 08',
    title: 'PLANT THE FIRST CROP',
    brief: ['Seed shelf, left wall. Take a tin to a bed. Potato first.'],
    objective: 'Take seeds from the shelf and plant a bed',
    hint: 'E at the shelf for a tin, then E at a bed.',
    waypointOf: (s) => s.greenhouse.siteId,
    isComplete: (s) => s.greenhouse.slots.some((sl) => sl.crop !== null),
  },
  {
    id: 'm_grow',
    code: 'MISSION 09',
    title: 'GROW THE CROP',
    brief: ['Keep it watered. I am running the clock fast so you can watch it grow.'],
    objective: 'Raise a crop to maturity',
    objectiveOf: (s) => {
      const best = Math.max(0, ...s.greenhouse.slots.map((sl) => (sl.crop ? sl.growth : 0)));
      return `Raise a crop to maturity (${Math.floor(best)}%)`;
    },
    hint: 'Fill the can at the tank, E at the bed to water. Lamps off means no growth.',
    waypointOf: (s) => s.greenhouse.siteId,
    progressOf: (s) => ({
      have: Math.floor(Math.max(0, ...s.greenhouse.slots.map((sl) => (sl.crop ? sl.growth : 0)))),
      need: 100,
    }),
    isComplete: (s) => s.greenhouse.slots.some((sl) => sl.ready),
  },
  {
    id: 'm_harvest',
    code: 'MISSION 10',
    title: 'HARVEST',
    brief: ['Go in and pick it.'],
    objective: 'Harvest your first Martian crop',
    hint: 'Step inside the greenhouse and press E at the finished bed.',
    waypointOf: (s) => s.greenhouse.siteId,
    isComplete: (s) => s.greenhouse.harvests >= 1,
    science:
      'In 2015 the ISS crew ate red romaine lettuce from the Veggie chamber — the first food ever harvested and eaten in space.',
  },
  {
    id: 'm_antenna',
    code: 'MISSION 11',
    title: 'RECOVER THE COMMUNICATIONS ANTENNA',
    brief: ['Now Earth. The dish is on the far ridge, north-east. Top up your oxygen.'],
    objective: 'Fetch the antenna from the ridge',
    hint: 'North-east, a long way. Take a spare canister.',
    waypoint: 'antenna_dish',
    isComplete: (s) => have(s, 'comm_antenna'),
  },
  {
    id: 'm_transmit',
    code: 'MISSION 12',
    title: 'REPAIR AND ACTIVATE THE TRANSMITTER',
    brief: ['The mast still stands. Antenna, cell, kit — we have it all. Go home.'],
    objective: 'Repair the transmitter',
    hint: 'Back to the crash site. Press E at the mast.',
    waypoint: 'transmitter',
    isComplete: (s) => !!s.flags.transmitted,
    science:
      'A radio signal needs between 5 and 20 minutes to cross from Mars to Earth, so every conversation is a message left, not a call made.',
  },
];

export const MISSION_COUNT = MISSIONS.length;

export function currentMission(s: GameState): MissionDef | null {
  return MISSIONS[s.missionIndex] ?? null;
}
