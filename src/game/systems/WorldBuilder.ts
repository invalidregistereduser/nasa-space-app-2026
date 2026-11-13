import Phaser from 'phaser';
import { BUILD_SITES, LOCATIONS, PICKUPS, SPAWN, STRUCTURES, WORLD } from '../constants';
import { makeRng } from '../art/draw';
import { getState } from '../../state/store';

export interface WorldRefs {
  solids: Phaser.Physics.Arcade.StaticGroup;
  pickupSprites: Map<string, Phaser.GameObjects.Container>;
  padSprites: Map<string, Phaser.GameObjects.Image>;
  greenhouse: Phaser.GameObjects.Image | null;
  greenhouseGlow: Phaser.GameObjects.Image | null;
  greenhouseDoor: Phaser.GameObjects.Image | null;
  truck: Phaser.GameObjects.Image | null;
  transmitter: Phaser.GameObjects.Image | null;
}

const DEPTH = {
  region: -1700,
  crater: -1500,
  decal: -1300,
};

interface Keepout {
  x: number;
  y: number;
  r: number;
}

/**
 * Hand-authored content: the named regions, the canyon walls, every structure,
 * construction pad and collectable. Procedural filler is streamed separately by
 * the ChunkManager, which asks this builder which ground is already spoken for.
 */
export class WorldBuilder {
  readonly refs: WorldRefs;
  private scene: Phaser.Scene;
  private keepouts: Keepout[] = [];
  /** Walking routes between mission sites — never blocked by procedural rock. */
  private routes: [number, number, number, number][] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.refs = {
      solids: scene.physics.add.staticGroup(),
      pickupSprites: new Map(),
      padSprites: new Map(),
      greenhouse: null,
      greenhouseGlow: null,
      greenhouseDoor: null,
      truck: null,
      transmitter: null,
    };
  }

  build() {
    this.collectKeepouts();
    this.buildRoutes();
    this.buildRegions();
    this.buildCanyon();
    this.buildStructures();
    this.buildSitePads();
    this.buildPickups();
  }

  /* ----------------------------------------------------------
     Reservations
     ---------------------------------------------------------- */
  private collectKeepouts() {
    Object.values(STRUCTURES).forEach((s) => this.keepouts.push({ x: s.x, y: s.y, r: 250 }));
    PICKUPS.forEach((p) => this.keepouts.push({ x: p.x, y: p.y, r: 130 }));
    BUILD_SITES.forEach((b) => this.keepouts.push({ x: b.x, y: b.y, r: 210 }));
    LOCATIONS.forEach((l) => this.keepouts.push({ x: l.x, y: l.y, r: 170 }));
    this.keepouts.push({ x: SPAWN.x, y: SPAWN.y, r: 220 });
  }

  /** Straight corridors linking the places the player has to walk between. */
  private buildRoutes() {
    const points: [number, number][] = [
      [SPAWN.x, SPAWN.y],
      [STRUCTURES.ship.x, STRUCTURES.ship.y + 80],
      [STRUCTURES.shelter.x, STRUCTURES.shelter.y],
      [BUILD_SITES[1].x, BUILD_SITES[1].y],
    ];
    for (let i = 0; i < points.length - 1; i++) {
      this.routes.push([points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]]);
    }
    // Every mission site connects back to the crash site.
    const hub: [number, number] = [STRUCTURES.ship.x, STRUCTURES.ship.y];
    [...LOCATIONS, ...PICKUPS].forEach((target) => {
      this.routes.push([hub[0], hub[1], target.x, target.y]);
    });
  }

  private static distanceToSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy || 1;
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
  }

  /**
   * True when hand-authored content owns this ground. Large props are also kept
   * clear of the walking routes so a mission site is never fenced in.
   */
  readonly reserved = (x: number, y: number, radius: number) => {
    for (const k of this.keepouts) {
      if (Phaser.Math.Distance.Between(x, y, k.x, k.y) < k.r + radius * 0.5) return true;
    }
    if (radius >= 50) {
      for (const r of this.routes) {
        if (WorldBuilder.distanceToSegment(x, y, r[0], r[1], r[2], r[3]) < 95) return true;
      }
    }
    return false;
  };

  /** Static collider sized to the base of a prop. */
  private addSolid(x: number, y: number, w: number, h: number) {
    const body = this.scene.add.rectangle(x, y, w, h);
    this.scene.physics.add.existing(body, true);
    this.refs.solids.add(body);
    body.setVisible(false);
    return body;
  }

  /* ----------------------------------------------------------
     Region colour patches — each location reads differently
     ---------------------------------------------------------- */
  private buildRegions() {
    const rng = makeRng(4242);
    const regionFor: Record<string, string> = {
      rocky_canyon: 'region_canyon',
      dust_plains: 'region_plains',
      crater_field: 'region_crater',
      distant_ridge: 'region_ridge',
      build_flats: 'region_flats',
      crash_site: 'region_crater',
      shelter: 'region_flats',
      rover_station: 'region_ridge',
    };
    LOCATIONS.forEach((loc) => {
      const key = regionFor[loc.id] ?? 'region_flats';
      const count = 3 + Math.floor(rng() * 2);
      for (let i = 0; i < count; i++) {
        const a = rng() * Math.PI * 2;
        const d = rng() * loc.radius * 0.9;
        this.scene.add
          .image(loc.x + Math.cos(a) * d, loc.y + Math.sin(a) * d, key)
          .setDepth(DEPTH.region)
          .setScale(0.9 + rng() * 0.7)
          .setAlpha(0.34 + rng() * 0.22)
          .setAngle(rng() * 360);
      }

      // A landmark silhouette so each site reads from a distance.
      if (loc.id === 'crater_field') {
        for (let i = 0; i < 7; i++) {
          const a = rng() * Math.PI * 2;
          const d = 120 + rng() * loc.radius * 0.8;
          this.scene.add
            .image(loc.x + Math.cos(a) * d, loc.y + Math.sin(a) * d * 0.7, `crater_${Math.floor(rng() * 3)}`)
            .setDepth(DEPTH.crater)
            .setScale(0.8 + rng() * 0.9)
            .setAlpha(0.9);
        }
      }
      if (loc.id === 'dust_plains') {
        for (let i = 0; i < 10; i++) {
          const a = rng() * Math.PI * 2;
          const d = 120 + rng() * loc.radius * 0.9;
          this.scene.add
            .image(loc.x + Math.cos(a) * d, loc.y + Math.sin(a) * d * 0.75, `dune_${Math.floor(rng() * 3)}`)
            .setDepth(DEPTH.crater + 10)
            .setScale(0.9 + rng() * 1.1)
            .setAlpha(0.6)
            .setFlipX(rng() > 0.5);
        }
      }
      if (loc.id === 'distant_ridge') {
        for (let i = 0; i < 12; i++) {
          const x = loc.x - 420 + (i / 11) * 840 + (rng() - 0.5) * 60;
          const y = loc.y - 180 + Math.sin((i / 11) * Math.PI) * -70 + (rng() - 0.5) * 50;
          const sprite = this.scene.add
            .image(x, y, `boulder_${Math.floor(rng() * 3)}`)
            .setDepth(y)
            .setScale(1.1 + rng() * 0.7)
            .setFlipX(rng() > 0.5);
          this.addSolid(x, y + sprite.displayHeight * 0.16, sprite.displayWidth * 0.5, sprite.displayHeight * 0.3);
        }
      }
    });
  }

  /** Two boulder ridges forming the canyon walls. */
  private buildCanyon() {
    const rng = makeRng(5150);
    const cx = 3280;
    const cy = 2520;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 16; i++) {
        const t = i / 15;
        const x = cx - 520 + t * 1040 + (rng() - 0.5) * 70;
        const y = cy + side * (210 + Math.sin(t * Math.PI * 1.4) * 95) + (rng() - 0.5) * 50;
        const scale = 1.3 + rng() * 0.9;
        const sprite = this.scene.add
          .image(x, y, `boulder_${Math.floor(rng() * 3)}`)
          .setDepth(y)
          .setScale(scale)
          .setFlipX(rng() > 0.5);
        this.addSolid(
          x,
          y + sprite.displayHeight * 0.16,
          sprite.displayWidth * 0.6,
          sprite.displayHeight * 0.34,
        );
        this.keepouts.push({ x, y, r: 120 });
      }
    }
  }

  /* ----------------------------------------------------------
     Structures
     ---------------------------------------------------------- */
  private buildStructures() {
    const scene = this.scene;

    // --- Crashed descent module -----------------------------------------
    const ship = STRUCTURES.ship;
    scene.add
      .image(ship.x, ship.y + 40, 'scorch')
      .setDepth(DEPTH.decal + 10)
      .setScale(1.1)
      .setAlpha(0.4);
    const hull = scene.add.image(ship.x, ship.y, 'prop_ship').setDepth(ship.y);
    this.addSolid(ship.x, ship.y + 40, hull.displayWidth * 0.62, 90);

    const rng = makeRng(606);
    for (let i = 0; i < 18; i++) {
      const a = rng() * Math.PI * 2;
      const d = 180 + rng() * 420;
      const x = ship.x + Math.cos(a) * d;
      const y = ship.y + Math.sin(a) * d * 0.7;
      scene.add
        .image(x, y, `debris_${Math.floor(rng() * 3)}`)
        .setDepth(y)
        .setScale(0.7 + rng() * 0.8)
        .setAngle(rng() * 360);
    }

    [
      { x: ship.x - 120, y: ship.y - 40, color: 0xff5a3c },
      { x: ship.x + 150, y: ship.y - 10, color: 0xf5a524 },
    ].forEach((light, i) => {
      const lamp = scene.add
        .image(light.x, light.y, 'glow')
        .setDepth(ship.y + 1)
        .setScale(0.5)
        .setTint(light.color)
        .setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: lamp,
        alpha: { from: 0.95, to: 0.15 },
        scale: { from: 0.55, to: 0.38 },
        duration: 760,
        delay: i * 380,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    scene.add
      .particles(ship.x + 90, ship.y - 30, 'smoke', {
        speed: { min: 6, max: 24 },
        angle: { min: 250, max: 290 },
        scale: { start: 0.5, end: 1.9 },
        alpha: { start: 0.42, end: 0 },
        lifespan: { min: 3200, max: 5200 },
        frequency: 420,
      })
      .setDepth(ship.y + 2);

    scene.add
      .particles(ship.x - 60, ship.y + 10, 'particle', {
        speed: { min: 20, max: 70 },
        angle: { min: 250, max: 290 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: { min: 400, max: 900 },
        frequency: 700,
        tint: [0xffc078, 0xff7a45],
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(ship.y + 3);

    // --- Transmitter mast -------------------------------------------------
    const tx = STRUCTURES.transmitter;
    this.refs.transmitter = scene.add.image(tx.x, tx.y, 'prop_transmitter').setDepth(tx.y);
    this.addSolid(tx.x, tx.y + 90, 60, 30);

    // --- Emergency shelter ------------------------------------------------
    const shelter = STRUCTURES.shelter;
    scene.add.image(shelter.x, shelter.y, 'prop_shelter').setDepth(shelter.y);
    this.addSolid(shelter.x, shelter.y + 20, 210, 80);
    const beacon = scene.add
      .image(shelter.x - 52, shelter.y - 95, 'glow')
      .setDepth(shelter.y + 1)
      .setScale(0.42)
      .setTint(0x38dcf8)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: beacon,
      alpha: { from: 0.9, to: 0.25 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // --- The signs that people live here ---------------------------------
    // A hand-painted welcome board, a flag somebody planted, a crate that has
    // become a table, and a mug nobody has taken back inside.
    scene.add
      .image(shelter.x + 188, shelter.y + 96, 'gh_sign')
      .setDepth(shelter.y + 96)
      .setScale(0.62)
      .setAngle(-2);
    scene.add.image(shelter.x + 74, shelter.y + 124, 'gh_crate').setDepth(shelter.y + 124).setScale(0.8);
    scene.add.image(shelter.x + 68, shelter.y + 106, 'gh_mug').setDepth(shelter.y + 125).setScale(0.8);
    scene.add
      .image(shelter.x - 104, shelter.y + 44, 'gh_photo')
      .setDepth(shelter.y + 44)
      .setScale(0.62)
      .setAngle(3);
    this.keepouts.push({ x: shelter.x + 120, y: shelter.y + 100, r: 150 });

    // --- Broken rover -----------------------------------------------------
    const rover = STRUCTURES.rover;
    scene.add.image(rover.x, rover.y, 'prop_rover').setDepth(rover.y);
    this.addSolid(rover.x, rover.y + 24, 170, 50);
    const roverLamp = scene.add
      .image(rover.x - 55, rover.y - 48, 'glow')
      .setDepth(rover.y + 1)
      .setScale(0.3)
      .setTint(0xff5a3c)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: roverLamp,
      alpha: { from: 0.8, to: 0.1 },
      duration: 980,
      yoyo: true,
      repeat: -1,
    });

    const rng2 = makeRng(707);
    for (let i = 0; i < 9; i++) {
      const a = rng2() * Math.PI * 2;
      const d = 120 + rng2() * 260;
      const x = rover.x + Math.cos(a) * d;
      const y = rover.y + Math.sin(a) * d * 0.72;
      scene.add
        .image(x, y, `debris_${Math.floor(rng2() * 3)}`)
        .setDepth(y)
        .setScale(0.6 + rng2() * 0.6)
        .setAngle(rng2() * 360);
    }
  }

  /* ----------------------------------------------------------
     Construction pads and collectables
     ---------------------------------------------------------- */
  private buildSitePads() {
    BUILD_SITES.forEach((site) => {
      const pad = this.scene.add
        .image(site.x, site.y, 'site_pad')
        .setDepth(DEPTH.decal + 20)
        .setAlpha(0.85);
      this.scene.tweens.add({
        targets: pad,
        alpha: { from: 0.45, to: 0.95 },
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.refs.padSprites.set(site.id, pad);
    });
  }

  private buildPickups() {
    const collected = getState().collected;
    PICKUPS.forEach((def) => {
      if (collected[def.id]) return;
      const container = this.scene.add.container(def.x, def.y).setDepth(def.y);

      const halo = this.scene.add
        .image(0, 8, 'glow')
        .setScale(0.65)
        .setTint(0x8ad8ff)
        .setAlpha(0.3)
        .setBlendMode(Phaser.BlendModes.ADD);
      const sprite = this.scene.add.image(0, 0, def.texture);
      container.add([halo, sprite]);

      this.scene.tweens.add({
        targets: sprite,
        y: -5,
        duration: 1900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.scene.tweens.add({
        targets: halo,
        alpha: { from: 0.18, to: 0.42 },
        scale: { from: 0.6, to: 0.78 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.refs.pickupSprites.set(def.id, container);
    });
  }

  /* ----------------------------------------------------------
     Greenhouse
     ---------------------------------------------------------- */
  placeGreenhouse(x: number, y: number, stage: number) {
    if (!this.refs.greenhouse) {
      this.refs.greenhouse = this.scene.add
        .image(x, y - 30, `prop_greenhouse_${stage}`)
        .setDepth(y);
      this.addSolid(x, y + 6, 190, 66);
      this.keepouts.push({ x, y, r: 230 });

      this.refs.greenhouseGlow = this.scene.add
        .image(x, y - 46, 'glow')
        .setDepth(y - 1)
        .setScale(2.6)
        .setTint(0x76dc92)
        .setAlpha(0)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: this.refs.greenhouseGlow,
        alpha: { from: 0.08, to: 0.26 },
        scale: { from: 2.4, to: 2.9 },
        duration: 2400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        paused: true,
      });

      // Ring on the ground at the door: the way in, readable from across the flats.
      this.refs.greenhouseDoor = this.scene.add
        .image(x, y + 30, 'marker_ring_green')
        .setDepth(y - 2)
        .setScale(0.85)
        .setAlpha(0)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: this.refs.greenhouseDoor,
        alpha: { from: 0.3, to: 0.62 },
        scaleX: { from: 0.8, to: 0.95 },
        scaleY: { from: 0.8, to: 0.95 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        paused: true,
      });
    } else {
      this.refs.greenhouse.setTexture(`prop_greenhouse_${stage}`);
    }
    const lit = stage >= 4;
    const glow = this.refs.greenhouseGlow;
    if (glow) {
      glow.setAlpha(lit ? 0.18 : 0);
      this.scene.tweens.getTweensOf(glow).forEach((t) => (lit ? t.resume() : t.pause()));
    }
    const door = this.refs.greenhouseDoor;
    if (door) {
      door.setAlpha(lit ? 0.38 : 0);
      this.scene.tweens.getTweensOf(door).forEach((t) => (lit ? t.resume() : t.pause()));
    }
    return this.refs.greenhouse;
  }

  /* ----------------------------------------------------------
     The parked truck
     ---------------------------------------------------------- */
  /** Shows the truck where it was left, or hides it while the player drives. */
  syncTruck(x: number, y: number, visible: boolean) {
    if (!this.refs.truck) {
      this.refs.truck = this.scene.add.image(x, y, 'truck', 0).setScale(1.3).setVisible(false);
    }
    const truck = this.refs.truck;
    truck.setVisible(visible);
    if (!visible) return;
    truck.setPosition(x, y);
    truck.setDepth(y);
  }

  removePickup(id: string) {
    const container = this.refs.pickupSprites.get(id);
    if (!container) return null;
    this.refs.pickupSprites.delete(id);
    return container;
  }

  /** Lowest world y that procedural content may use. */
  get surfaceTop() {
    return WORLD.horizon + 40;
  }
}
