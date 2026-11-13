import Phaser from 'phaser';
import {
  BUILD_SITES,
  LOCATIONS,
  PICKUPS,
  PIXELS_PER_METRE,
  STRUCTURES,
} from '../constants';
import type { WorldBuilder } from './WorldBuilder';
import {
  canBuildGreenhouse,
  canRepairTransmitter,
  collectPickup,
  inspectRover,
  repairRover,
  replenishAtShelter,
  toggleRover,
} from '../../state/gameplay';
import {
  discover,
  getState,
  hasItem,
  learn,
  openPanel,
  say,
  setFlag,
  setPrompt,
} from '../../state/store';
import { transient } from '../../state/transient';
import { sfx } from '../../audio/AudioEngine';
import { live } from '../../state/live';
import { bus } from '../bus';

export interface Interactable {
  id: string;
  x: number;
  y: number;
  /** Overrides x/y for things that move, like the truck. */
  at?: () => { x: number; y: number };
  radius: number;
  label: () => string;
  detail?: () => string | undefined;
  enabled: () => boolean;
  /** Hidden interactables are skipped entirely — no prompt at all. */
  hidden?: () => boolean;
  run: () => void;
}

export class Interactions {
  private scene: Phaser.Scene;
  private world: WorldBuilder;
  private items: Interactable[] = [];
  private nearest: Interactable | null = null;
  private accumulator = -1000;
  private highlight: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, world: WorldBuilder) {
    this.scene = scene;
    this.world = world;

    // Soft ring that sits under whatever the player can act on right now.
    this.highlight = scene.add
      .image(0, 0, 'marker_ring')
      .setAlpha(0)
      .setScale(0.6)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: this.highlight,
      scaleX: { from: 0.55, to: 0.72 },
      scaleY: { from: 0.55, to: 0.72 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.build();
  }

  private build() {
    // --- Scattered components -------------------------------------------
    // Pickups are not prompts. Walk onto one and it is yours.

    // --- Shelter ---------------------------------------------------------
    this.items.push({
      id: 'shelter',
      x: STRUCTURES.airlock.x,
      y: STRUCTURES.airlock.y,
      radius: 110,
      label: () => 'Replenish suit at the shelter',
      detail: () => 'Oxygen · Water · Power',
      enabled: () => true,
      run: () => replenishAtShelter(),
    });

    // --- Rover -----------------------------------------------------------
    this.items.push({
      id: 'rover',
      x: STRUCTURES.rover.x,
      y: STRUCTURES.rover.y + 40,
      radius: 110,
      label: () => (getState().flags.roverSurveyed ? 'Rover survey log' : 'Read the rover survey log'),
      enabled: () => true,
      run: () => inspectRover(),
    });

    // --- The truck -------------------------------------------------------
    this.items.push({
      id: 'truck',
      x: 0,
      y: 0,
      at: () => {
        // While you are driving it, the truck is wherever you are.
        if (live.riding) return { x: live.x, y: live.y };
        const r = getState().rover;
        return { x: r.x, y: r.y };
      },
      radius: 120,
      label: () => {
        const s = getState();
        if (!s.rover.fixed) {
          return hasItem('repair_kit') ? 'Repair the rover' : 'Rover needs a repair kit';
        }
        return live.riding ? 'Park the rover' : 'Drive the rover';
      },
      detail: () => {
        const s = getState();
        if (!s.rover.fixed) return 'Six wheels and a pressurised cab, if you can get it running';
        return live.riding ? undefined : 'Twice walking pace, and it saves your oxygen';
      },
      enabled: () => getState().rover.fixed || hasItem('repair_kit'),
      hidden: () => !getState().flags.roverSurveyed,
      run: () => {
        const s = getState();
        if (!s.rover.fixed) {
          repairRover();
          return;
        }
        const boarding = toggleRover(live.x, live.y);
        bus.emit('world:ride', { riding: boarding });
      },
    });

    // --- Descent module --------------------------------------------------
    this.items.push({
      id: 'ship',
      x: STRUCTURES.ship.x,
      y: STRUCTURES.ship.y + 60,
      radius: 130,
      label: () => 'Search the descent module',
      enabled: () => true,
      run: () => {
        sfx('ui_open');
        if (!getState().flags.searchedShip) {
          say(
            [
              'The main cabin is torn open. Most of the crew lockers are gone, {name}.',
              'I can still read four life-signs beacons on the surface — faint, scattered, alive. We will find them.',
              'For now, the priority is your own survival.',
            ],
            { key: 'ship-search' },
          );
          learn(
            'descent',
            'Entry, descent and landing',
            'The riskiest seven minutes of any Mars mission: a spacecraft must shed about 20,000 km/h using a heat shield, a supersonic parachute and retro-rockets, with no help from Earth.',
          );
        } else {
          say(['Nothing more to salvage here, {name}.'], { key: 'ship-again' });
        }
        getState().flags.searchedShip = true;
      },
    });

    // --- Transmitter -----------------------------------------------------
    this.items.push({
      id: 'transmitter',
      x: STRUCTURES.transmitter.x,
      y: STRUCTURES.transmitter.y + 90,
      radius: 110,
      label: () =>
        canRepairTransmitter() ? 'Repair and activate the transmitter' : 'Emergency transmitter mast',
      detail: () =>
        canRepairTransmitter() ? undefined : 'Needs antenna · power cell · repair kit',
      enabled: () => canRepairTransmitter() && !getState().flags.transmitted,
      run: () => openPanel('build'),
    });

    // --- Construction sites ----------------------------------------------
    BUILD_SITES.forEach((site) => {
      this.items.push({
        id: site.id,
        x: site.x,
        y: site.y,
        // Generous once the greenhouse is standing — the door should not be fiddly.
        radius: 175,
        label: () => {
          const gh = getState().greenhouse;
          if (gh.built) return 'Step into the greenhouse';
          if (gh.siteId === site.id) return 'Begin construction';
          return `Survey site: ${site.name}`;
        },
        detail: () => {
          const gh = getState().greenhouse;
          if (gh.built) return undefined;
          if (gh.siteId === site.id && !canBuildGreenhouse()) return 'Missing components';
          return site.note;
        },
        enabled: () => {
          const gh = getState().greenhouse;
          if (gh.built) return gh.siteId === site.id;
          return true;
        },
        hidden: () => {
          const gh = getState().greenhouse;
          return gh.built && gh.siteId !== site.id;
        },
        run: () => {
          const gh = getState().greenhouse;
          if (gh.built && gh.siteId === site.id) {
            bus.emit('world:enter-greenhouse');
            return;
          }
          if (gh.built) return;
          transient.surveyedSite = site.id;
          openPanel('build');
          sfx('ui_open');
        },
      });
    });
  }

  private collectEffect(container: Phaser.GameObjects.Container, icon: string) {
    const { x, y } = container;
    const scene = this.scene;
    const cam = scene.cameras.main;
    bus.emit('ui:collect-fx', {
      icon,
      screenX: (x - cam.worldView.x) * cam.zoom,
      screenY: (y - cam.worldView.y) * cam.zoom,
    });

    scene.tweens.add({
      targets: container,
      y: y - 46,
      scale: 0.2,
      alpha: 0,
      duration: 480,
      ease: 'Back.easeIn',
      onComplete: () => container.destroy(),
    });

    const ring = scene.add
      .image(x, y + 6, 'marker_ring')
      .setDepth(y + 1)
      .setScale(0.3)
      .setAlpha(0.95);
    scene.tweens.add({
      targets: ring,
      scale: 1.5,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });

    const burst = scene.add.particles(x, y, 'particle', {
      speed: { min: 40, max: 150 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 700,
      quantity: 18,
      tint: [0x38dcf8, 0xffffff, 0x76dc92],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    burst.setDepth(y + 2);
    burst.explode(18);
    scene.time.delayedCall(1200, () => burst.destroy());
  }

  /** Called from the scene update; throttled. */
  update(_delta: number, px: number, py: number) {
    const now = performance.now();
    if (now - this.accumulator < 80) return;
    this.accumulator = now;

    let best: Interactable | null = null;
    let bestAt = { x: 0, y: 0 };
    let bestDist = Infinity;
    for (const item of this.items) {
      if (item.hidden?.()) continue;
      const at = item.at?.() ?? item;
      const d = Phaser.Math.Distance.Between(px, py, at.x, at.y);
      if (d <= item.radius && d < bestDist) {
        bestDist = d;
        best = item;
        bestAt = { x: at.x, y: at.y };
      }
    }
    if (best) {
      this.highlight.setPosition(bestAt.x, bestAt.y + 14);
      this.highlight.setDepth(bestAt.y - 2);
      this.highlight.setTint(best.enabled() ? 0x8ae4ff : 0x9aa6b5);
      this.highlight.setAlpha(best.enabled() ? 0.75 : 0.35);
    } else {
      this.highlight.setAlpha(0);
    }

    this.nearest = best;
    setPrompt(
      best
        ? {
            id: best.id,
            label: best.label(),
            detail: best.detail?.(),
            enabled: best.enabled(),
          }
        : null,
    );

    this.checkDiscovery(px, py);
    this.checkAutoPickup(px, py);
  }

  /** Walking over a component picks it up. No prompt, no press, no message. */
  private checkAutoPickup(px: number, py: number) {
    const collected = getState().collected;
    for (const def of PICKUPS) {
      if (collected[def.id]) continue;
      if (Phaser.Math.Distance.Between(px, py, def.x, def.y) > 64) continue;
      collectPickup(def.id);
      const container = this.world.removePickup(def.id);
      const first = Object.keys(def.grants)[0] ?? 'box';
      if (container) this.collectEffect(container, first);
      break;
    }
  }

  private checkDiscovery(px: number, py: number) {
    let currentArea: string | null = null;
    for (const loc of LOCATIONS) {
      const d = Phaser.Math.Distance.Between(px, py, loc.x, loc.y);
      if (d < loc.radius) {
        if (!currentArea) currentArea = loc.id;
        if (d < loc.radius * 0.65 && discover(loc.id)) {
          sfx('discover');
          bus.emit('camera:focus', { zoom: 1.1, hold: 600 });
        }
      }
    }
    live.area = currentArea;
  }

  interact() {
    const target = this.nearest;
    if (!target) return;
    setFlag('tutInteract');
    if (!target.enabled()) {
      sfx('warn');
      return;
    }
    target.run();
  }

  /** Metres between the player and a world point, for HUD readouts. */
  static distanceMetres(ax: number, ay: number, bx: number, by: number) {
    return Math.round(Phaser.Math.Distance.Between(ax, ay, bx, by) / PIXELS_PER_METRE);
  }
}
