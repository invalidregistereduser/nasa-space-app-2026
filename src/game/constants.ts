import type { ItemId } from '../types';

/* ============================================================
   World metrics
   ============================================================ */
export const WORLD = {
  width: 5120,
  height: 3200,
  /** Everything above this line is distant, non-walkable backdrop terrain. */
  horizon: 620,
  tile: 256,
  /** Fog-of-war grid resolution. */
  fogCell: 32,
};

export const FOG_COLS = Math.ceil(WORLD.width / WORLD.fogCell);
export const FOG_ROWS = Math.ceil(WORLD.height / WORLD.fogCell);

export const PLAYER = {
  speed: 178,
  runMultiplier: 1.55,
  bodyRadius: 11,
  bodyOffsetY: 24,
  scale: 1,
};

/** 1 sol compressed into this many real seconds. */
export const SOL_SECONDS = 260;

/* ============================================================
   Palette (Phaser numeric colours)
   ============================================================ */
export const C = {
  space: 0x03050d,
  sky: 0xc99470,
  ground: 0x8c4425,
  groundDark: 0x5e2c18,
  groundPale: 0xb98a5e,
  rock: 0x5a3b2a,
  rockLight: 0x8a6049,
  rockDark: 0x32211a,
  dust: 0xd2a071,
  nav: 0x38dcf8,
  navDim: 0x16b8da,
  bio: 0x76dc92,
  warn: 0xf5a524,
  alert: 0xff5a3c,
  metal: 0xb8c2cc,
  metalDark: 0x5d6a78,
  white: 0xf2f7ff,
};

/* ============================================================
   Named locations
   ============================================================ */
export interface LocationDef {
  id: string;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  /** Radius at which the location is marked as discovered. */
  radius: number;
  icon: string;
  tint: number;
}

export const LOCATIONS: LocationDef[] = [
  {
    id: 'crash_site',
    name: 'Crash Site',
    subtitle: 'ARES HORIZON-7 descent module',
    x: 1240,
    y: 2240,
    radius: 420,
    icon: 'ship',
    tint: 0xff7a4a,
  },
  {
    id: 'shelter',
    name: 'Emergency Shelter',
    subtitle: 'Pressurised habitat · oxygen & water',
    x: 1840,
    y: 2470,
    radius: 300,
    icon: 'dome',
    tint: 0x38dcf8,
  },
  {
    id: 'build_flats',
    name: 'Construction Flats',
    subtitle: 'Level bedrock · suitable for building',
    x: 2180,
    y: 2180,
    radius: 330,
    icon: 'grid',
    tint: 0x76dc92,
  },
  {
    id: 'rover_station',
    name: 'Broken Rover Station',
    subtitle: 'Solar array · power cells',
    x: 980,
    y: 1320,
    radius: 360,
    icon: 'rover',
    tint: 0xf5a524,
  },
  {
    id: 'crater_field',
    name: 'Vallis Crater Field',
    subtitle: 'Impact craters · scattered cargo',
    x: 2500,
    y: 1080,
    radius: 420,
    icon: 'crater',
    tint: 0xd2a071,
  },
  {
    id: 'rocky_canyon',
    name: 'Rocky Canyon',
    subtitle: 'Layered canyon walls · structural debris',
    x: 3280,
    y: 2520,
    radius: 430,
    icon: 'canyon',
    tint: 0xb8794a,
  },
  {
    id: 'dust_plains',
    name: 'Dust Plains',
    subtitle: 'Open regolith · wind-rippled dunes',
    x: 3700,
    y: 1620,
    radius: 450,
    icon: 'dune',
    tint: 0xe4c7a3,
  },
  {
    id: 'distant_ridge',
    name: 'Distant Ridge',
    subtitle: 'High ground · communications antenna',
    x: 4430,
    y: 760,
    radius: 420,
    icon: 'ridge',
    tint: 0x9aa7ff,
  },
];

export const LOCATION_BY_ID: Record<string, LocationDef> = Object.fromEntries(
  LOCATIONS.map((l) => [l.id, l]),
);

export const SPAWN = { x: 1390, y: 2410 };

/* ============================================================
   Collectables scattered across the surface
   ============================================================ */
export interface PickupDef {
  id: string;
  /** Items granted when picked up. */
  grants: Partial<Record<ItemId, number>>;
  x: number;
  y: number;
  label: string;
  texture: string;
  locationId: string;
  /** Headline shown by the discovery animation. */
  discovery?: string;
  science?: string;
  /** Marked on the map once the rover survey is complete. */
  surveyed?: boolean;
}

export const PICKUPS: PickupDef[] = [
  {
    id: 'supply_box',
    grants: { oxygen_canister: 2, ration_pack: 2, repair_kit: 1 },
    x: 1536,
    y: 2318,
    label: 'Emergency Supply Box',
    texture: 'prop_supplybox',
    locationId: 'crash_site',
    discovery: 'Emergency supplies recovered',
    science:
      'Crewed mission planning assumes roughly 0.84 kg of oxygen per astronaut per day — supply caches are sized around that number.',
  },
  {
    id: 'seed_vault_pod',
    grants: { seed_vault: 1 },
    x: 1086,
    y: 2122,
    label: 'Earth Seed Vault',
    texture: 'prop_seedvault',
    locationId: 'crash_site',
    discovery: 'Seed vault recovered',
    science:
      'Seeds flown to space are stored cold and dry; NASA has flown potato, lettuce, wheat and zinnia seeds to the ISS.',
    surveyed: true,
  },
  {
    id: 'planting_crate',
    grants: { planting_containers: 1 },
    x: 1980,
    y: 2612,
    label: 'Planting Containers',
    texture: 'prop_planters',
    locationId: 'shelter',
    discovery: 'Planting containers recovered',
    science:
      'The ISS Veggie facility grows plants in "pillows" of baked clay with slow-release fertiliser instead of loose soil.',
    surveyed: true,
  },
  {
    id: 'panel_crate',
    grants: { glass_panels: 1 },
    x: 2452,
    y: 1012,
    label: 'Transparent Hull Panels',
    texture: 'prop_panels',
    locationId: 'crater_field',
    discovery: 'Pressure panels recovered',
    science:
      'Habitat windows are multi-layer: an inner pressure pane, an outer debris pane, and UV-blocking layers between them.',
    surveyed: true,
  },
  {
    id: 'frame_strut',
    grants: { greenhouse_frame: 1 },
    x: 3338,
    y: 2566,
    label: 'Greenhouse Frame',
    texture: 'prop_frame',
    locationId: 'rocky_canyon',
    discovery: 'Greenhouse frame recovered',
    science:
      'Inflatable and deployable frames are favoured for Mars because mass and launch volume are the scarcest resources.',
    surveyed: true,
  },
  {
    id: 'water_unit',
    grants: { water_recycler: 1 },
    x: 3748,
    y: 1588,
    label: 'Water Recycling Unit',
    texture: 'prop_waterunit',
    locationId: 'dust_plains',
    discovery: 'Water recycler recovered',
    science:
      "The ISS Water Recovery System reclaims about 98% of the crew's water, including humidity from the cabin air.",
    surveyed: true,
  },
  {
    id: 'solar_array',
    grants: { solar_panel: 1 },
    x: 1052,
    y: 1256,
    label: 'Solar Array Section',
    texture: 'prop_solar',
    locationId: 'rover_station',
    discovery: 'Solar array recovered',
    science:
      'Sunlight at Mars carries only ~43% of the energy it does at Earth, so arrays must be larger for the same power.',
    surveyed: true,
  },
  {
    id: 'battery_cell',
    grants: { power_cell: 1 },
    x: 892,
    y: 1412,
    label: 'Rover Power Cell',
    texture: 'prop_powercell',
    locationId: 'rover_station',
    discovery: 'Power cell recovered',
    science:
      'Rovers store energy in lithium-ion packs to survive the night, when surface temperatures can fall below -80 °C.',
    surveyed: true,
  },
  {
    id: 'antenna_dish',
    grants: { comm_antenna: 1 },
    x: 4452,
    y: 820,
    label: 'Communications Antenna',
    texture: 'prop_antenna',
    locationId: 'distant_ridge',
    discovery: 'Antenna dish recovered',
    science:
      'A radio signal takes between 5 and 20 minutes to reach Earth from Mars, depending on where the planets are in their orbits.',
  },
  /* Bonus oxygen caches that reward exploration. */
  {
    id: 'cache_o2_a',
    grants: { oxygen_canister: 1 },
    x: 2860,
    y: 1860,
    label: 'Scattered Oxygen Canister',
    texture: 'prop_canister',
    locationId: 'dust_plains',
    discovery: 'Oxygen canister recovered',
  },
  {
    id: 'cache_o2_b',
    grants: { oxygen_canister: 1 },
    x: 3960,
    y: 2320,
    label: 'Scattered Oxygen Canister',
    texture: 'prop_canister',
    locationId: 'rocky_canyon',
  },
  {
    id: 'cache_o2_c',
    grants: { oxygen_canister: 1, ration_pack: 1 },
    x: 1660,
    y: 940,
    label: 'Fallen Cargo Pod',
    texture: 'prop_cargopod',
    locationId: 'crater_field',
    discovery: 'Cargo pod opened',
  },
];

export const PICKUP_BY_ID: Record<string, PickupDef> = Object.fromEntries(
  PICKUPS.map((p) => [p.id, p]),
);

/** Items required before the greenhouse can be raised. */
export const BUILD_REQUIREMENTS: { id: ItemId; label: string }[] = [
  { id: 'greenhouse_frame', label: 'Greenhouse frame' },
  { id: 'glass_panels', label: 'Transparent panels' },
  { id: 'water_recycler', label: 'Water recycling unit' },
  { id: 'solar_panel', label: 'Solar array' },
  { id: 'planting_containers', label: 'Planting containers' },
  { id: 'seed_vault', label: 'Earth seed vault' },
];

export const TRANSMITTER_REQUIREMENTS: { id: ItemId; label: string }[] = [
  { id: 'comm_antenna', label: 'Communications antenna' },
  { id: 'power_cell', label: 'Power cell' },
  { id: 'repair_kit', label: 'Repair kit' },
];

/* ============================================================
   Fixed structures the player can interact with
   ============================================================ */
export const STRUCTURES = {
  ship: { x: 1240, y: 2240 },
  shelter: { x: 1840, y: 2470 },
  airlock: { x: 1840, y: 2560 },
  rover: { x: 980, y: 1320 },
  transmitter: { x: 1448, y: 2078 },
};

export interface BuildSiteDef {
  id: string;
  name: string;
  x: number;
  y: number;
  note: string;
}

/**
 * Ground the truck cannot cross: broken rock in the canyon, and the climb up to
 * the ridge. The last stretch of both is on foot, which is the point.
 */
export const ROUGH_TERRAIN: { x: number; y: number; r: number }[] = [
  { x: 3280, y: 2520, r: 430 },
  { x: 4430, y: 760, r: 420 },
  { x: 2500, y: 1080, r: 300 },
];

export const BUILD_SITES: BuildSiteDef[] = [
  {
    id: 'site_north',
    name: 'North Terrace',
    x: 2104,
    y: 1984,
    note: 'Open sky, best solar exposure. Slightly exposed to wind.',
  },
  {
    id: 'site_central',
    name: 'Sheltered Hollow',
    x: 2238,
    y: 2206,
    note: 'Ringed by low rock. Balanced light and wind protection.',
  },
  {
    id: 'site_south',
    name: 'Shelter Approach',
    x: 2036,
    y: 2404,
    note: 'Closest to the habitat airlock. Shorter walk when oxygen is low.',
  },
];

export const BUILD_SITE_BY_ID: Record<string, BuildSiteDef> = Object.fromEntries(
  BUILD_SITES.map((b) => [b.id, b]),
);

/** Distance in world pixels treated as one metre for readouts. */
export const PIXELS_PER_METRE = 14;
