# MARS: THE LAST SIGNAL

**Survive. Explore. Rebuild.**

A complete, playable 2D Mars survival game that runs entirely in the browser. Built for the
**NASA Space Apps Challenge** as a hands-on way to teach what it actually takes to keep a human
alive on another planet: oxygen budgets, solar power, closed water loops, toxic regolith, and
why the first Martian meal has to be grown inside a pressure vessel.

Your descent vehicle, *ARES HORIZON-7*, comes down hard on Sol 1. The crew is scattered, Earth has
gone quiet, and your suit AI — **ARES NAV** — has exactly one plan: recover what survived the
crash, build a greenhouse, grow food, and get a signal home.

The greenhouse is not a menu. Once it is standing you walk through the airlock and into it — a
room you can cross, with six planting beds, a water tank, a seed shelf, grow lamps on switches, a
compost bin and a workbench console, and Mars visible through the dome above the glass.

Everything you see and hear is **generated in the browser from code**. There are no image files,
no sprite sheets and no audio files anywhere in this repository.

---

## Contents

- [Quick start](#quick-start)
- [Controls](#controls)
- [Playing the demo](#playing-the-demo-10-15-minutes)
- [Inside the greenhouse](#inside-the-greenhouse)
- [Features](#features)
- [Educational content](#educational-content)
- [Technology](#technology)
- [Project structure](#project-structure)
- [Assets and attribution](#assets-and-attribution)
- [Development notes](#development-notes)
- [Troubleshooting](#troubleshooting)

---

## Quick start

You need [Node.js](https://nodejs.org) **20.19+ or 22.12+** (the range Vite 8 supports) and npm.
Nothing else — no API keys, no accounts, no paid services, no asset downloads.

### Linux / macOS

```bash
cd mars-the-last-signal
npm install
npm run dev
```

### Windows (PowerShell or Command Prompt)

```powershell
cd mars-the-last-signal
npm install
npm run dev
```

Then open **<http://localhost:5173>** in Chrome, Edge, Firefox or Safari.

### Production build

```bash
npm run build     # type-checks, then bundles into dist/
npm run preview   # serves the built bundle at http://localhost:4173
```

The contents of `dist/` are plain static files — drop them on any static host (GitHub Pages,
Netlify, Vercel, an S3 bucket) and the game runs.

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-check with `tsc` and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Type-check only |

---

## Controls

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` or arrow keys | Walk, or drive the truck |
| `Shift` (held) | Move faster — burns oxygen quicker |
| `E` | Interact with the highlighted object; board or park the truck |
| `I` | Pack |
| `M` | Surface map |
| `N` | Missions and science log |
| `L` | Radio log |
| `Space` / `Enter` | Advance dialogue |
| `Esc` | Pause menu (or close the open panel) |
| Mouse | Every menu, panel, slider and button; hover a planting bed inside the greenhouse for its status card |

Components are picked up by walking onto them — there is nothing to press and no message when you
do. Everything else lives behind the single menu button in the top-left corner.

Inside the greenhouse the controls are the same — walk up to a bed, the tank, the seed shelf, a
lamp switch, the compost bin, the workbench or the breaker, and press `E`. The prompt always tells
you what `E` will do next.

On phones and tablets an on-screen stick and action buttons appear automatically, the keyboard
hints step aside, and objective text switches from key names to thumb wording.

---

## Playing the demo (10–15 minutes)

The first mission runs beginning to end. ARES NAV marks every objective with a beacon in the world,
a marker or screen-edge arrow with the distance in metres, and a dot on the minimap — so you can
never be truly lost.

1. **Cinematic intro** — a starfield, a typewriter prologue and the approach to Mars.
2. **Enter your name.** Everything ARES NAV says afterwards uses it.
3. **Choose your astronaut** — two suits, identical capability. Changeable later in Settings.
4. **The crash.** Warning klaxons, atmospheric entry, landing system failure, impact.
5. **Sol 1.** You wake beside the wreck. ARES NAV boots up and teaches you to walk.
6. **Recover the emergency supply box** near the descent module (oxygen, rations, a repair kit).
7. **Walk north-west to the broken rover** and read its survey log — this plots the whole debris
   field on your map. Spend your repair kit on the truck parked beside it and you can drive from
   then on: twice walking pace, and the pressurised cab all but stops your oxygen draining.
8. **Recover six greenhouse components** scattered across five regions: the seed vault in the
   wreck, planting trays by the shelter, hull panels in the crater field, the structural frame in
   the Rocky Canyon, the water recycler out on the Dust Plains, and a solar array at the rover
   station.
9. **Choose a construction site** from three surveyed pads on the Construction Flats — each has a
   genuine trade-off (sunlight vs. wind shelter vs. a short walk to the airlock).
10. **Raise the greenhouse.** It assembles in stages: frame, glazing, equipment, power-up.
11. **Step through the airlock.** Everything from here happens inside the room: throw the main
    breaker, connect the water recycler and fill the watering can, then rinse and dose the regolith
    in the beds.
12. **Take a seed tin from the shelf, plant a bed, water it**, and watch the light pooling under
    the lamps. Work in a scoop of compost if you want it to come up faster, and switch lamp rows on
    and off to spend your battery where it matters.
13. **Harvest the first food ever grown on Mars.** Four more seed types unlock.
14. **Fetch the high-gain antenna** from the Distant Ridge — the longest walk in the game. Top up
    your oxygen at the shelter first.
15. **Repair the transmitter** at the crash site and send the signal.

Watch your oxygen. The shelter refills it for free; canisters in your inventory do it anywhere.
Running out is survivable — your suit puts you into emergency hibernation and the beacon walks you
home — but you lose time you may not have.

---

## Inside the greenhouse

The greenhouse is a second playable scene, not a dialog. Walk to the airlock on the surface, press
`E`, and the camera moves inside with you; the surface scene parks itself and resumes exactly where
it was when you step back out.

| In the room | What it does |
| --- | --- |
| **Six planting beds** | Prepare, plant, water, compost and harvest, one press at a time. Hover any bed for a card with crop, growth, water and time to maturity. |
| **Water tank and watering can** | Connect the recycler once, then refill the can at the tank. Beds drink from the can, so water is a thing you carry, not a button. |
| **Seed shelf** | Opens the seed tins. Potato and red romaine to begin with; cherry tomatoes, bush beans, kitchen herbs and dwarf wheat after the first harvest. |
| **Grow lamps on three row switches** | Each row of beds has its own lamps and its own share of the battery. Lamps off, a row crawls at a tenth speed but keeps drying out. |
| **Compost bin** | Scoop compost, work it into a bed, and that bed grows about a third faster. |
| **Workbench console** | The systems and climate readout: startup state, battery, temperature, lamp brightness, row switches and a glance at every bed. |
| **Main breaker** | The room is dark and dead until you throw it. |
| **The dome** | Mars through the glass, condensation, drifting mist, light pooling on the floor under the lamps. |

---

## Features

### World and exploration
- **Endless streamed surface.** The terrain is generated in 512 px chunks around the camera from a
  seeded hash, so the screen is always full of Mars, the world has no edge and no void, and walking
  away and back rebuilds exactly the same rocks in exactly the same places. Chunks are pooled, so
  crossing the map allocates nothing after warm-up.
- A **hand-authored mission region** of eight named sites sits inside that endless surface. Streamed
  rock never spawns on a site, an interaction point or a walking route between them.
- **Always daylight.** The surface is lit, warm and readable at every distance — no night cycle, no
  darkness overlays, no dimmed patches anywhere on screen. Sols still advance for farming and the HUD.
- **Exploration lives on the map, not in the dark.** Unsurveyed ground is drawn as stylised
  contour hatching on the map screen and minimap, and fills in with real terrain as you walk it.
- Footprints that linger in the dust, boots that kick up puffs of regolith, drifting dust, gusts that
  sweep across the view, blinking wreck beacons, smoke from the crash site and a three-layer parallax
  mountain horizon under a butterscotch sky.
- **Signs that somebody lives here.** A flag planted by the shelter, a crate with a mug left on it,
  a photo taped up by the door, a hand-lettered sign on the greenhouse. Stand still for a few
  seconds and the astronaut stretches, checks the wrist display or looks up at the sky, and now and
  then says something to themself about the view, the cold or the first green thing in four sols.

### Survival
- Four live resources: **oxygen, water, nutrition and suit power**, each with its own drain rate,
  warnings and recovery path. Only oxygen is on the HUD by default — it is the one that forces a
  decision minute to minute. The others appear automatically the moment they drop into their
  warning band, so the screen stays quiet until it matters.
- **A drivable surface truck.** Repair the old survey rover with a repair kit and it becomes
  transport: six wheels, about twice walking pace, and a pressurised cab that cuts suit oxygen
  use to a quarter. Park it anywhere and it stays there, across saves.
- Shelter replenishment, consumable canisters and rations, and a forgiving blackout-and-recover
  failure state instead of a hard game over.

### Farming
- A six-part component hunt, a **player-chosen build site**, and a staged construction animation.
- A three-step startup sequence (power → water → trays) that each teach a real constraint, carried
  out by hand inside the room: the breaker, the recycler, the beds.
- **A walkable greenhouse interior** — six planting beds, a water tank and watering can, a seed
  shelf, three switchable lamp rows, a compost bin, a workbench console and Mars through the dome.
- **Six crops** — potato, red romaine, cherry tomatoes, bush beans, kitchen herbs and dwarf wheat —
  each drawn live at five growth stages, each with its own rate, thirst and science note.
- A growth model driven by water, temperature, **per-row lamp light** and battery charge. Compost
  speeds a bed up by about a third. Rows with their lamps off still dry out.
- A closed water loop that returns 70% of everything you pour.

### Guidance and interface
- **ARES NAV**, a holographic suit assistant that briefs every objective, warns about oxygen,
  explains the science, celebrates your wins, and marks waypoints — without playing the game for you.
  It also volunteers a hint if an objective stalls, and never freezes you while it talks.
- **Contextual tutorial cards** introduce one idea at a time — WASD, then E, then the inventory, then
  the map — each shown the first moment it matters and never again once you have done it.
- **Guidance that cannot be lost:** an on-screen pulsing marker for visible targets, a screen-edge
  arrow with the name and distance for anything off-screen, a corner minimap, and a full map screen
  showing where you are, where you are going, and which ground you have walked.
- **A HUD of four small things.** One menu button top-left, one mission chip top-right (hover it
  for the objective and the distance), one oxygen ring bottom-left, the map bottom-right. Pack,
  map, missions, log and pause all sit behind the menu button, or on their own keys.
- **One message at a time, and as few as possible.** Nothing is announced that the player can
  already see: walking onto a component collects it silently, arriving somewhere does not pop a
  card. At most one toast exists at any moment, ARES speaks one short line at a time, and a
  finished objective and the next brief arrive as a single piece of speech rather than two.
- **Stored transmissions** from the relay queue arrive as you pass milestones — fragments of the
  mission that was supposed to happen, read out in the dialogue log.
- Flat panels with one border and one shadow, hover and press states on everything clickable,
  labelled action buttons, stat bars and an animated keycap prompt.
- Pause menu, audio mixer and comfort settings: interface scale, reduce motion, screen shake, text
  speed, colourblind-friendly gauges, waypoint arrow and hints.
- **Saving is opt-in.** Nothing about a run is written to the browser until the player ticks
  "Save my progress in this browser" on the title screen, in Settings, or by asking to save from
  the pause menu. Once they have, the run autosaves to localStorage every 25 seconds and at every
  milestone, including a bit-packed copy of the surveyed-ground grid, so Continue drops them
  exactly where they left off. Turning the setting off again deletes what was stored. Saves
  written by earlier builds still load.

### Audio
- Every sound is synthesised live with the Web Audio API: a wind bed that thickens when you step
  outside, an evolving four-chord ambient pad with delay, footsteps, interface blips, alarms,
  construction impacts and the transmission sweep. Mixer and mute in Settings.

---

## Educational content

The science is woven into play rather than bolted on. Every component you recover and every
objective you finish adds an entry to the in-game **science log** (`N` → Science log). All of it is
real:

| Topic | In-game moment |
| --- | --- |
| A sol is 24 h 39 m 35 s | First objective complete |
| Mars' atmosphere is ~95% CO₂ at under 1% of Earth's pressure | Why the greenhouse must be sealed |
| Sunlight at Mars carries ~43% of the energy it does at Earth | Solar array recovery and battery management |
| Martian regolith holds 0.5–1% perchlorate salts, toxic to humans | Preparing the planting trays |
| The ISS Water Recovery System reclaims ~98% of the crew's water | Connecting the recycler |
| NASA and the International Potato Center grew potatoes in simulated Martian conditions (2016) | Planting your first crop |
| ISS astronauts ate space-grown red romaine in 2015 | First harvest |
| Signals take 5–20 minutes to cross between Earth and Mars | Repairing the transmitter |
| Mars' gravity is 38% of Earth's | Rover survey |
| Fruiting crops need hand or fan pollination — there are no bees in a sealed habitat | Planting cherry tomatoes |
| Bean roots host nitrogen-fixing bacteria that fertilise the tray for the next planting | Planting bush beans |
| Dwarf wheat was bred for closed-life-support research: short stalks, high yield per square metre | Planting dwarf wheat |
| Flavour and aroma are treated as real countermeasures to crew fatigue on long missions | Harvesting kitchen herbs |
| Entry, descent and landing sheds ~20,000 km/h in seven minutes | Searching the descent module |

---

## Technology

| Layer | Choice | Why |
| --- | --- | --- |
| App shell, menus, HUD | **React 19 + TypeScript** | Declarative UI with strong typing |
| Game world | **Phaser 3.90** | Mature 2D engine: camera, arcade physics, particles, render textures |
| Styling | **Tailwind CSS v4** | Fast, consistent design tokens for the sci-fi interface |
| Build | **Vite 8** | Instant dev server, small production bundle |
| Art | **Canvas 2D, generated at runtime** | No asset pipeline, no downloads, fully original |
| Audio | **Web Audio API, synthesised** | No audio files, no licensing questions |
| Persistence | **localStorage** | Zero backend |

State lives in a small external store (`useSyncExternalStore`) shared by React and Phaser, so the
HUD and the world never disagree. High-frequency values (position, facing, waypoint distance) are
kept out of React state entirely and sampled at a low rate by the HUD.

---

## Project structure

```
src/
├── main.tsx                 entry point
├── App.tsx                  phase router: title → intro → name → character → crash → play → ending
├── types.ts                 shared domain types
├── index.css                Tailwind theme, design tokens, component classes
│
├── state/                   game state, independent of the renderer
│   ├── store.ts             external store + React binding, dialogue, toasts, panels
│   ├── gameplay.ts          simulation tick, survival, crops, missions, interactions
│   ├── missions.ts          the twelve-objective mission chain
│   ├── items.ts             item and crop definitions with their science notes
│   ├── save.ts              localStorage save / load / settings / old-save migration
│   ├── fog.ts               bit-packed exploration grid
│   ├── thoughts.ts          the astronaut's passing thoughts
│   ├── transmissions.ts     stored messages that arrive at milestones
│   ├── transient.ts         throwaway UI context (seed tin in hand, compost scoop)
│   └── live.ts              per-frame values shared with the HUD
│
├── game/                    everything Phaser
│   ├── PhaserGame.ts        game construction and teardown
│   ├── constants.ts         world metrics, locations, pickups, build sites
│   ├── bus.ts               typed React ↔ Phaser event bus
│   ├── waypoints.ts         waypoint resolution
│   ├── scenes/              BootScene (texture generation), WorldScene (the surface),
│   │                        GreenhouseScene (the walkable interior)
│   ├── systems/             Backdrop (infinite sky/ground), ChunkManager (streamed
│   │                        terrain), WorldBuilder (authored sites), PlayerController,
│   │                        Interactions, Effects
│   └── art/                 procedural texture generators
│       ├── draw.ts          canvas helpers: noise, blobs, gradients, shadows
│       ├── astronaut.ts     12×4 animated astronaut sheets with idle fidgets, two suits
│       ├── truck.ts         the drivable surface truck, four facings
│       ├── terrain.ts       ground, regions, rocks, craters, dunes, ridges
│       ├── structures.ts    ship, shelter, rover, greenhouse stages, transmitter
│       ├── interior.ts      floor, dome glazing, beds, tank, shelf, bench, lamps,
│       │                    compost, switches, airlock and the human clutter
│       ├── crops.ts         six crops drawn at five growth stages each
│       └── props.ts         collectables, markers, site pads, debris
│
├── ui/
│   ├── screens/             title, intro, name entry, character select, crash, game, ending
│   ├── hud/                 vitals, objective card, ARES NAV dialogue, prompts, toasts,
│   │                        tutorial cards, minimap, waypoint arrow, mission banner,
│   │                        collect effects, save indicator, touch controls, thought
│   │                        bubble, planting-bed hover card
│   ├── panels/              inventory, map, nav, greenhouse console, seed shelf,
│   │                        construction, pause, settings, log
│   ├── canvas/              starfield + Mars, astronaut preview, live plant rendering
│   └── components/          icons, panel chrome, typewriter
│
├── audio/AudioEngine.ts     synthesised music and sound effects
└── util/                    time and text helpers
```

---

## Assets and attribution

- **All artwork is original and procedurally generated** at runtime with the Canvas 2D API:
  terrain tiles, rocks, craters, dunes, the crashed lander, the habitat, the rover, the greenhouse
  construction stages, every collectable, the astronaut sprite sheets and the animated planet.
  Nothing is traced, downloaded or copied.
- **All audio is synthesised** at runtime with the Web Audio API. No samples, no recordings.
- **Fonts:** system stacks only — a condensed face for display type, the platform UI sans for body
  text and the platform monospace for data readouts. Nothing is fetched from the network, so the
  game looks identical offline.
- **Science references:** NASA mission pages and published results for MOXIE, the ISS Water
  Recovery System, the ISS Veggie facility, the NASA/International Potato Center Mars potato
  study, and standard Mars environmental figures.
- *ARES HORIZON-7*, its crew and the events of this story are fiction. The constraints they face
  are not.

---

## Development notes

- `art-lab.html` (dev server only, at <http://localhost:5173/art-lab.html>) renders every generated
  texture on one page — useful when tuning the art. Filter it with a hash, e.g. `#structures` or
  `#greenhouse`.
- In development, `window.__mars` exposes the store, the event bus and the Phaser game for
  debugging. It is compiled out of production builds.
- The world's texture generation runs once at boot and takes roughly 250 ms on a laptop.
- Target is a steady 60 fps at 1080p. The main performance dials are the chunk size and margin
  (`src/game/systems/ChunkManager.ts`), the per-frame chunk build budget (2), the pool ceiling, and
  the particle counts in `Effects`.
- Streaming is pooled and bounded: walking in one direction and back reuses the same sprite and
  collider instances instead of allocating new ones.
- The two scenes hand over with `scene.switch`, so the surface keeps its state and its streamed
  chunks while you are indoors and costs nothing to come back to. The simulation tick keeps running
  in both.
- Saves from earlier builds still load: `migrateSlots` in `src/state/save.ts` pads four-bed saves
  out to six and fills in the fields the newer greenhouse needs.

---

## Troubleshooting

**Port 5173 is already in use.** Vite will pick the next free port and print it; use that URL.

**`npm install` warns about the Node version.** Vite 8 needs Node 20.19+ or 22.12+. Older versions
may install but fail to start the dev server.

**`npm install` fails behind a proxy.** Set `npm config set registry https://registry.npmjs.org/`
and retry, or install with `npm ci` from the committed lockfile.

**The screen is black after the crash cinematic.** The game needs WebGL (it falls back to Canvas 2D,
but prefers WebGL). Check `chrome://gpu`, or try another browser.

**The world looks empty for a moment after a long teleport.** Chunks build two per frame; they fill
in within a frame or two. `warmUp()` is called after scripted moves so this should never be visible
in normal play.

**No sound.** Browsers block audio until you interact with the page — click once. Check the mixer
in Settings, and that your system output is not muted.

**Continue is greyed out.** There is no save yet. Saving is off until you turn it on, so tick
"Save my progress in this browser" on the title screen before or during a run. Saves live in
localStorage under `mars-last-signal/save/v1` and can be deleted from Settings.

---

## Licence

Code and generated assets: MIT. Built for the NASA Space Apps Challenge.
