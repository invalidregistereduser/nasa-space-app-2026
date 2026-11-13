import type { CropDef, CropId, ItemDef, ItemId } from '../types';

export const ITEMS: Record<ItemId, ItemDef> = {
  oxygen_canister: {
    id: 'oxygen_canister',
    name: 'Oxygen Canister',
    category: 'survival',
    blurb: 'Refills +40% suit oxygen.',
    science:
      "Mars' atmosphere is about 95% carbon dioxide and only 0.13% oxygen, at less than 1% of Earth's surface pressure. Every breath outside has to be carried.",
    icon: 'canister',
    stackable: true,
  },
  ration_pack: {
    id: 'ration_pack',
    name: 'Ration Pack',
    category: 'survival',
    blurb: 'Restores +30% food.',
    science:
      'Freeze-dried rations keep for years but lose vitamins C and K over time — one reason a Mars crew needs fresh crops.',
    icon: 'ration',
    stackable: true,
  },
  repair_kit: {
    id: 'repair_kit',
    name: 'Repair Kit',
    category: 'survival',
    blurb: 'Tools and sealant for field repairs.',
    science:
      'ISS crews carry a Maintenance Work Area and printed spares; on Mars, repair capability replaces resupply entirely.',
    icon: 'tools',
    stackable: true,
  },
  power_cell: {
    id: 'power_cell',
    name: 'Power Cell',
    category: 'component',
    blurb: 'Charged lithium pack from the rover.',
    science:
      'Rover batteries must survive nights below -80 °C, so they are kept warm with surplus daytime power.',
    icon: 'battery',
    stackable: false,
  },
  greenhouse_frame: {
    id: 'greenhouse_frame',
    name: 'Greenhouse Frame',
    category: 'component',
    blurb: 'Primary structural ribs of the grow module.',
    science:
      'Deployable frames are preferred for Mars habitats: launch mass and stowed volume are the two hardest limits to beat.',
    icon: 'frame',
    stackable: false,
  },
  glass_panels: {
    id: 'glass_panels',
    name: 'Transparent Panels',
    category: 'component',
    blurb: 'Pressure-rated glazing for the grow module.',
    science:
      'Habitat glazing is layered: an inner pressure pane, an outer micrometeoroid pane and UV-blocking films between them.',
    icon: 'panel',
    stackable: false,
  },
  water_recycler: {
    id: 'water_recycler',
    name: 'Water Recycling Unit',
    category: 'component',
    blurb: 'Closes the water loop for the greenhouse.',
    science:
      "The ISS Water Recovery System reclaims about 98% of the crew's water, condensing humidity straight back out of the cabin air.",
    icon: 'water',
    stackable: false,
  },
  solar_panel: {
    id: 'solar_panel',
    name: 'Solar Array',
    category: 'component',
    blurb: 'Generates power during daylight hours.',
    science:
      'Mars receives roughly 43% of the sunlight Earth does, and a global dust storm can block most of what is left for weeks.',
    icon: 'solar',
    stackable: false,
  },
  planting_containers: {
    id: 'planting_containers',
    name: 'Planting Containers',
    category: 'component',
    blurb: 'Sealed trays with a root-zone water wick.',
    science:
      'In microgravity and low gravity, water clings instead of draining, so root zones use wicking media and careful metering.',
    icon: 'tray',
    stackable: false,
  },
  seed_vault: {
    id: 'seed_vault',
    name: 'Earth Seed Vault',
    category: 'component',
    blurb: 'Cold-stored seed stock carried from Earth.',
    science:
      'Potato, lettuce, wheat, radish and zinnia have all been grown off Earth aboard the ISS.',
    icon: 'seeds',
    stackable: false,
  },
  comm_antenna: {
    id: 'comm_antenna',
    name: 'Communications Antenna',
    category: 'component',
    blurb: 'High-gain dish for the emergency transmitter.',
    science:
      'Deep-space links use high-gain dishes aimed with fractions of a degree of accuracy across hundreds of millions of kilometres.',
    icon: 'antenna',
    stackable: false,
  },
  potato: {
    id: 'potato',
    name: 'Martian Potato',
    category: 'harvest',
    blurb: 'Grown on Mars. Restores +45% food.',
    science:
      'In 2016 NASA and the International Potato Center grew potatoes in a sealed CubeSat that recreated Martian soil chemistry, pressure and temperature swings.',
    icon: 'potato',
    stackable: true,
  },
  lettuce: {
    id: 'lettuce',
    name: 'Red Romaine',
    category: 'harvest',
    blurb: 'Fresh greens. Restores +25% food.',
    science:
      'Astronauts ate space-grown red romaine lettuce aboard the ISS in 2015 — the first food harvested and eaten in orbit.',
    icon: 'lettuce',
    stackable: true,
  },
  tomato: {
    id: 'tomato',
    name: 'Cherry Tomatoes',
    category: 'harvest',
    blurb: 'Sweet, warm from the lamps. Restores +30% nutrition.',
    science:
      'Fruiting crops need hand or fan pollination off Earth — there are no bees in a sealed habitat.',
    icon: 'tomato',
    stackable: true,
  },
  beans: {
    id: 'beans',
    name: 'Bush Beans',
    category: 'harvest',
    blurb: 'Protein and nitrogen for the next planting. Restores +32% nutrition.',
    science:
      'Bean roots host nitrogen-fixing bacteria, quietly fertilising the tray for whatever you plant next.',
    icon: 'beans',
    stackable: true,
  },
  herbs: {
    id: 'herbs',
    name: 'Kitchen Herbs',
    category: 'harvest',
    blurb: 'Barely any calories. Restores +12% nutrition and a lot of morale.',
    science:
      'Flavour and aroma are treated as real countermeasures to crew fatigue on long missions.',
    icon: 'herbs',
    stackable: true,
  },
  wheat: {
    id: 'wheat',
    name: 'Dwarf Wheat',
    category: 'harvest',
    blurb: 'Grain stock. Restores +35% food.',
    science:
      'Dwarf wheat was bred for closed-life-support research: short stalks, high yield per square metre, fast turnaround.',
    icon: 'wheat',
    stackable: true,
  },
};

export const CROPS: Record<CropId, CropDef> = {
  potato: {
    id: 'potato',
    name: 'Potato',
    growSeconds: 110,
    waterUse: 0.38,
    idealTemp: 20,
    tempTolerance: 7,
    yieldAmount: 2,
    foodValue: 45,
    color: 0x9ad06a,
    blurb: 'Dense calories, forgiving roots. The classic survival crop.',
    science:
      'Potatoes deliver more calories per square metre than almost any other crop, which is why they headline Mars farming studies.',
    unlockedFromStart: true,
  },
  lettuce: {
    id: 'lettuce',
    name: 'Red Romaine',
    growSeconds: 78,
    waterUse: 0.46,
    idealTemp: 18,
    tempTolerance: 5,
    yieldAmount: 3,
    foodValue: 25,
    color: 0x7fd98a,
    blurb: 'Fast, thirsty, and rich in the vitamins rations lose.',
    science:
      'Leafy greens are flown first because they mature in weeks and need no processing before eating.',
    unlockedFromStart: false,
  },
  tomato: {
    id: 'tomato',
    name: 'Cherry Tomato',
    growSeconds: 130,
    waterUse: 0.5,
    idealTemp: 23,
    tempTolerance: 5,
    yieldAmount: 3,
    foodValue: 30,
    color: 0xe0563c,
    blurb: 'Thirsty and fussy about warmth — and worth every drop.',
    science:
      'Tomatoes were among the first fruiting crops trialled for closed life support: they need pollination by hand or by fan in the absence of insects.',
    unlockedFromStart: false,
  },
  beans: {
    id: 'beans',
    name: 'Bush Beans',
    growSeconds: 145,
    waterUse: 0.34,
    idealTemp: 21,
    tempTolerance: 7,
    yieldAmount: 3,
    foodValue: 32,
    color: 0x7cc85f,
    blurb: 'Fixes nitrogen back into the tray. Good for the next crop.',
    science:
      'Legumes host bacteria that pull nitrogen out of the air and fix it into the soil, which is why they are a staple of closed-loop farming plans.',
    unlockedFromStart: false,
  },
  herbs: {
    id: 'herbs',
    name: 'Kitchen Herbs',
    growSeconds: 70,
    waterUse: 0.26,
    idealTemp: 20,
    tempTolerance: 8,
    yieldAmount: 2,
    foodValue: 12,
    color: 0x6fd38a,
    blurb: 'Not many calories. An enormous amount of morale.',
    science:
      'Crew psychologists rate fresh aroma and flavour as a genuine countermeasure to the monotony of long-duration missions.',
    unlockedFromStart: false,
  },
  wheat: {
    id: 'wheat',
    name: 'Dwarf Wheat',
    growSeconds: 155,
    waterUse: 0.3,
    idealTemp: 22,
    tempTolerance: 9,
    yieldAmount: 4,
    foodValue: 35,
    color: 0xe0c069,
    blurb: 'Slow but generous. Also scrubs CO2 from habitat air.',
    science:
      'Crops double as life support: a wheat stand photosynthesises CO2 out of the cabin and releases oxygen back into it.',
    unlockedFromStart: false,
  },
};

export const ITEM_LIST = Object.values(ITEMS);

export function itemName(id: ItemId): string {
  return ITEMS[id]?.name ?? id;
}
