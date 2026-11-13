import Phaser from 'phaser';
import { PlayerController } from '../systems/PlayerController';
import { bus } from '../bus';
import { stageForGrowth } from '../art/crops';
import { CROPS } from '../../state/items';
import { BED_ROWS, getState, openPanel, say, setPrompt, setState, toast } from '../../state/store';
import {
  ghActivatePower,
  ghConnectWater,
  ghFertilise,
  ghHarvest,
  ghPlant,
  ghPrepareTrays,
  ghRefillCan,
  ghToggleRow,
  ghWaterBed,
} from '../../state/gameplay';
import { transient } from '../../state/transient';
import { live } from '../../state/live';
import { tickWorld } from '../../state/gameplay';
import { audio, sfx } from '../../audio/AudioEngine';

const ROOM = { width: 1840, height: 1260 };
const GLASS_H = 230;
const FLOOR_TOP = 250;
const DOOR = { x: 920, y: 1196 };
const SPAWN = { x: 920, y: 1110 };

/** Bed anchors: three rows of two, running down the middle of the room. */
const BEDS = [
  { x: 650, y: 450 },
  { x: 1200, y: 450 },
  { x: 650, y: 690 },
  { x: 1200, y: 690 },
  { x: 650, y: 930 },
  { x: 1200, y: 930 },
];
const ROW_Y = [450, 690, 930];

interface Zone {
  id: string;
  x: number;
  y: number;
  radius: number;
  label: () => string;
  detail?: () => string | undefined;
  enabled: () => boolean;
  run: () => void;
}

interface BedView {
  index: number;
  frame: Phaser.GameObjects.Image;
  soil: Phaser.GameObjects.Image;
  plant: Phaser.GameObjects.Image;
  droop: number;
}

/**
 * The inside of the greenhouse: a warm, humid room the player walks around in.
 * It runs the same simulation tick as the surface, so crops keep growing and
 * missions keep tracking while you are in here.
 */
export class GreenhouseScene extends Phaser.Scene {
  private player!: PlayerController;
  private beds: BedView[] = [];
  private lamps: Phaser.GameObjects.Image[] = [];
  private cones: Phaser.GameObjects.Image[] = [];
  private switches: Phaser.GameObjects.Image[] = [];
  private zones: Zone[] = [];
  private nearest: Zone | null = null;
  private promptAccumulator = -1000;
  private syncAccumulator = 0;
  private leaving = false;

  constructor() {
    super('Greenhouse');
  }

  create() {
    this.buildRoom();
    this.buildFixtures();
    this.buildBeds();
    this.buildHumanTouches();

    this.player = new PlayerController(this, SPAWN.x, SPAWN.y, getState().character);
    this.player.indoor = true;
    this.physics.world.setBounds(90, FLOOR_TOP + 60, ROOM.width - 180, ROOM.height - FLOOR_TOP - 120);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, ROOM.width, ROOM.height);
    cam.setZoom(Phaser.Math.Clamp(this.scale.gameSize.height / 700, 0.78, 1.5));
    cam.startFollow(this.player.sprite, true, 0.1, 0.1);
    cam.setDeadzone(120, 90);
    cam.setBackgroundColor(0x1b2b22);

    this.buildZones();
    this.buildAtmosphere();

    bus.on('ui:interact', this.onInteract);
    this.events.on('wake', this.onWake, this);
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      bus.off('ui:interact', this.onInteract);
      this.scale.off('resize', this.onResize, this);
    });

    this.onEnter();
  }

  private onResize = () => {
    this.cameras.main.setZoom(Phaser.Math.Clamp(this.scale.gameSize.height / 700, 0.78, 1.5));
  };

  /* ----------------------------------------------------------
     Room shell
     ---------------------------------------------------------- */
  private buildRoom() {
    this.add.tileSprite(0, FLOOR_TOP, ROOM.width, ROOM.height - FLOOR_TOP, 'gh_floor')
      .setOrigin(0, 0)
      .setDepth(-1000);

    // Dome glazing with Mars beyond it.
    this.add.tileSprite(0, 0, ROOM.width, GLASS_H, 'gh_glass').setOrigin(0, 0).setDepth(-900);

    // Warm light spilling off the glass onto the back of the room.
    const spill = this.add.graphics().setDepth(-880);
    spill.fillGradientStyle(0xffd9a8, 0xffd9a8, 0xffd9a8, 0xffd9a8, 0.22, 0.22, 0, 0);
    spill.fillRect(0, GLASS_H - 10, ROOM.width, 190);

    // Wall panels around the room.
    this.add.tileSprite(0, GLASS_H - 6, ROOM.width, 70, 'gh_wall').setOrigin(0, 0).setDepth(-890);
    this.add
      .tileSprite(0, ROOM.height - 86, ROOM.width, 86, 'gh_wall')
      .setOrigin(0, 0)
      .setDepth(ROOM.height - 86);
    const leftWall = this.add
      .tileSprite(0, FLOOR_TOP, 90, ROOM.height - FLOOR_TOP, 'gh_wall')
      .setOrigin(0, 0)
      .setDepth(-870);
    leftWall.setTileScale(1, 1);
    this.add
      .tileSprite(ROOM.width - 90, FLOOR_TOP, 90, ROOM.height - FLOOR_TOP, 'gh_wall')
      .setOrigin(0, 0)
      .setDepth(-870);

    // Soft green bounce light across the floor.
    const tint = this.add.graphics().setDepth(-860);
    tint.fillStyle(0x6fc08a, 0.05);
    tint.fillRect(0, FLOOR_TOP, ROOM.width, ROOM.height - FLOOR_TOP);
    // Warm pool of light in the middle of the room.
    const pool = this.add
      .image(ROOM.width / 2, ROOM.height * 0.62, 'glow')
      .setDisplaySize(ROOM.width * 1.1, ROOM.height * 1.1)
      .setTint(0xffd2a0)
      .setAlpha(0.08)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(-855);
    void pool;
  }

  private solid(x: number, y: number, w: number, h: number) {
    const body = this.add.rectangle(x, y, w, h).setVisible(false);
    this.physics.add.existing(body, true);
    this.physics.add.collider(this.playerSprite(), body);
    return body;
  }

  private playerSprite() {
    return this.player?.sprite ?? (undefined as unknown as Phaser.GameObjects.GameObject);
  }

  private buildFixtures() {
    // Water tank and the can hanging beside it.
    this.add.image(200, 760, 'gh_tank').setDepth(760);
    this.add.image(300, 830, 'gh_can').setDepth(830);

    // Seed shelf.
    this.add.image(200, 430, 'gh_shelf').setDepth(430);

    // Workbench with the systems console.
    this.add.image(1640, 470, 'gh_bench').setDepth(470);

    // Compost bin.
    this.add.image(1640, 830, 'gh_compost').setDepth(830);

    // Airlock back to the surface.
    this.add.image(DOOR.x, DOOR.y - 40, 'gh_airlock').setDepth(DOOR.y);
    this.add.image(1120, 1150, 'gh_breaker').setDepth(1150);

    // Row switches on the left wall.
    ROW_Y.forEach((y, row) => {
      const sw = this.add.image(140, y - 60, 'gh_switch_on').setDepth(y - 60);
      this.switches.push(sw);
      void row;
    });

    // Grow lamps and their light cones.
    ROW_Y.forEach((y, row) => {
      [650, 1200].forEach((x) => {
        const cone = this.add
          .image(x, y - 112, 'gh_lightcone')
          .setOrigin(0.5, 0)
          .setDisplaySize(250, 180)
          .setDepth(-500)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.5);
        this.cones.push(cone);
        const lamp = this.add.image(x, y - 126, 'gh_lamp_on').setDepth(ROOM.height + 40);
        this.lamps.push(lamp);
      });
      void row;
    });
  }

  private buildBeds() {
    BEDS.forEach((pos, index) => {
      const frame = this.add.image(pos.x, pos.y, 'gh_bed').setDepth(pos.y);
      const soil = this.add.image(pos.x, pos.y - 21, 'gh_soil').setDepth(pos.y + 1);
      const plant = this.add
        .image(pos.x, pos.y - 8, 'crop_potato_0')
        .setOrigin(0.5, 1)
        .setDepth(pos.y + 2)
        .setVisible(false);
      this.beds.push({ index, frame, soil, plant, droop: 0 });

      frame.setInteractive({ useHandCursor: true });
      frame.on('pointerover', () => {
        live.hoverBed = index;
      });
      frame.on('pointerout', () => {
        if (live.hoverBed === index) live.hoverBed = null;
      });
      frame.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        live.hoverX = pointer.x;
        live.hoverY = pointer.y;
      });
    });
  }

  /** The small signs that somebody actually lives here. */
  private buildHumanTouches() {
    this.add.image(DOOR.x, 1052, 'gh_sign').setDepth(1052);
    this.add.image(760, 1130, 'gh_photo').setDepth(1130);
    this.add.image(1520, 980, 'gh_crate').setDepth(980);
    this.add.image(1528, 952, 'gh_mug').setDepth(981);
    this.add.image(330, 1070, 'gh_flag').setDepth(1070);
    this.add.image(300, 300, 'gh_potted').setDepth(300);
    this.add.image(1560, 300, 'gh_potted').setDepth(300).setFlipX(true);
  }

  private buildAtmosphere() {
    // Fine mist drifting over the beds.
    this.add
      .particles(0, 0, 'particle', {
        x: { min: 420, max: 1420 },
        y: { min: 360, max: 1000 },
        speedY: { min: -14, max: -3 },
        speedX: { min: -8, max: 8 },
        scale: { min: 0.1, max: 0.42 },
        alpha: { start: 0.16, end: 0 },
        lifespan: { min: 2600, max: 5200 },
        tint: [0xdffbe9, 0xffffff],
        frequency: 110,
        quantity: 1,
      })
      .setDepth(ROOM.height + 20);

    // Condensation glint on the glass.
    const sheen = this.add
      .image(ROOM.width / 2, GLASS_H / 2, 'glow')
      .setDisplaySize(ROOM.width * 0.8, GLASS_H * 1.6)
      .setTint(0xdff6ff)
      .setAlpha(0.08)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(-880);
    this.tweens.add({
      targets: sheen,
      alpha: { from: 0.05, to: 0.14 },
      duration: 5200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Colliders for the furniture.
    this.solid(200, 800, 150, 150);
    this.solid(200, 470, 170, 120);
    this.solid(1640, 510, 200, 110);
    this.solid(1640, 860, 110, 100);
    this.solid(1520, 1000, 96, 60);
    BEDS.forEach((pos) => this.solid(pos.x, pos.y + 6, 190, 86));
  }

  /* ----------------------------------------------------------
     Interaction zones
     ---------------------------------------------------------- */
  private buildZones() {
    const gh = () => getState().greenhouse;

    // Beds.
    BEDS.forEach((pos, index) => {
      this.zones.push({
        id: `bed_${index}`,
        x: pos.x,
        y: pos.y + 70,
        radius: 125,
        label: () => {
          const state = getState();
          const slot = state.greenhouse.slots[index];
          if (!state.greenhouse.containersReady) return 'Prepare the growing medium';
          if (!slot) return 'Planting bed';
          if (slot.ready) return `Harvest the ${CROPS[slot.crop!].name.toLowerCase()}`;
          if (!slot.crop) {
            return transient.selectedSeed
              ? `Plant ${CROPS[transient.selectedSeed].name.toLowerCase()}`
              : 'Take seeds from the shelf first';
          }
          if (transient.compostScoop && !slot.fertilised) return 'Work in the compost';
          if (state.greenhouse.wateringCan >= 20 && slot.water < 98) return 'Water this bed';
          return `${CROPS[slot.crop].name} · ${Math.floor(slot.growth)}%`;
        },
        detail: () => {
          const slot = getState().greenhouse.slots[index];
          if (!slot?.crop) return undefined;
          if (slot.water < 30) return 'The soil is dry';
          if (slot.health < 55) return 'It is looking sorry for itself';
          return undefined;
        },
        enabled: () => {
          const state = getState();
          const slot = state.greenhouse.slots[index];
          if (!state.greenhouse.containersReady) return state.greenhouse.power;
          if (!slot) return false;
          if (slot.ready) return true;
          if (!slot.crop) return transient.selectedSeed !== null;
          if (transient.compostScoop && !slot.fertilised) return true;
          return state.greenhouse.wateringCan >= 20 && slot.water < 98;
        },
        run: () => {
          const state = getState();
          const slot = state.greenhouse.slots[index];
          if (!state.greenhouse.containersReady) {
            ghPrepareTrays();
            return;
          }
          if (!slot) return;
          if (slot.ready) {
            ghHarvest(index);
            this.celebrate(BEDS[index].x, BEDS[index].y);
            return;
          }
          if (!slot.crop) {
            if (!transient.selectedSeed) return;
            ghPlant(index, transient.selectedSeed);
            this.puff(BEDS[index].x, BEDS[index].y - 10, 0x8ad8a0);
            return;
          }
          if (transient.compostScoop && !slot.fertilised) {
            ghFertilise(index);
            transient.compostScoop = false;
            this.puff(BEDS[index].x, BEDS[index].y - 10, 0x8a6b3f);
            return;
          }
          ghWaterBed(index);
          this.splash(BEDS[index].x, BEDS[index].y - 14);
        },
      });
    });

    // Water tank.
    this.zones.push({
      id: 'tank',
      x: 270,
      y: 790,
      radius: 130,
      label: () =>
        gh().waterConnected
          ? `Fill the watering can (${Math.round(gh().wateringCan)}%)`
          : 'Connect the water recycler',
      enabled: () => true,
      run: () => {
        if (!gh().waterConnected) ghConnectWater();
        else ghRefillCan();
      },
    });

    // Seed shelf.
    this.zones.push({
      id: 'shelf',
      x: 270,
      y: 470,
      radius: 125,
      label: () =>
        transient.selectedSeed
          ? `Seed tin: ${CROPS[transient.selectedSeed].name}`
          : 'Choose seeds from the shelf',
      enabled: () => true,
      run: () => {
        sfx('ui_open');
        openPanel('seeds');
      },
    });

    // Workbench console.
    this.zones.push({
      id: 'bench',
      x: 1560,
      y: 500,
      radius: 130,
      label: () => 'Open the systems console',
      enabled: () => true,
      run: () => {
        sfx('ui_open');
        openPanel('greenhouse');
      },
    });

    // Compost bin.
    this.zones.push({
      id: 'compost',
      x: 1560,
      y: 850,
      radius: 120,
      label: () => (transient.compostScoop ? 'Compost in hand' : 'Scoop some compost'),
      enabled: () => !transient.compostScoop,
      run: () => {
        transient.compostScoop = true;
        sfx('plant');
        toast({ kind: 'info', title: 'Compost scooped', text: 'Work it into any bed.', ttl: 3200 });
      },
    });

    // Lamp switches.
    ROW_Y.forEach((y, row) => {
      this.zones.push({
        id: `switch_${row}`,
        x: 210,
        y: y - 50,
        radius: 105,
        label: () => `Row ${row + 1} lamps · ${gh().lightRows[row] ? 'on' : 'off'}`,
        enabled: () => gh().power,
        run: () => ghToggleRow(row),
      });
    });

    // Power breaker.
    this.zones.push({
      id: 'breaker',
      x: 1120,
      y: 1150,
      radius: 110,
      label: () => (gh().power ? 'Main power · on' : 'Switch on the main power'),
      enabled: () => !gh().power,
      run: () => ghActivatePower(),
    });

    // Airlock.
    this.zones.push({
      id: 'airlock',
      x: DOOR.x,
      y: DOOR.y - 20,
      radius: 130,
      label: () => 'Step back outside',
      enabled: () => true,
      run: () => this.exitToSurface(),
    });
  }

  /* ----------------------------------------------------------
     Transitions
     ---------------------------------------------------------- */
  private onEnter() {
    live.indoors = true;
    live.hoverBed = null;
    this.leaving = false;
    this.player.teleport(SPAWN.x, SPAWN.y);
    this.cameras.main.centerOn(SPAWN.x, SPAWN.y);
    this.cameras.main.fadeIn(520, 18, 34, 26);
    audio.setExposure(false);
    sfx('airlock');
    bus.emit('gh:enter');

    const gh = getState().greenhouse;
    if (!gh.visited) {
      setState({ greenhouse: { ...gh, visited: true } });
      say(
        [
          'Pressure is good. You can take the helmet off in here, {name}.',
          'Power first, then water, then the beds. I will keep an eye on the numbers.',
        ],
        { key: 'gh-first-entry' },
      );
    }
    const lines = gh.visited
      ? [
          'Warm in here. Smells like soil and rain.',
          'Helmet off. Four breaths of air that is mine.',
          'Quietest room on the planet.',
          'The lamps hum. It almost sounds like a kitchen.',
        ]
      : ['Warm in here. Smells like soil and rain.'];
    bus.emit('ui:thought', { text: lines[Math.floor(Math.random() * lines.length)] });
  }

  private onWake = () => {
    this.onEnter();
  };

  private exitToSurface() {
    if (this.leaving) return;
    this.leaving = true;
    setPrompt(null);
    live.indoors = false;
    live.hoverBed = null;
    sfx('airlock');
    this.cameras.main.fadeOut(380, 18, 34, 26);
    this.time.delayedCall(400, () => {
      if (!this.scene.isActive()) return;
      bus.emit('gh:exit');
      this.scene.switch('World');
    });
  }

  /* ----------------------------------------------------------
     Feedback
     ---------------------------------------------------------- */
  private puff(x: number, y: number, tint: number) {
    const burst = this.add.particles(x, y, 'particle', {
      speed: { min: 20, max: 90 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.45, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 700,
      quantity: 12,
      tint,
      emitting: false,
    });
    burst.setDepth(y + 40);
    burst.explode(12);
    this.time.delayedCall(1100, () => burst.destroy());
  }

  private splash(x: number, y: number) {
    const burst = this.add.particles(x, y, 'particle', {
      speed: { min: 30, max: 110 },
      angle: { min: 190, max: 350 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 520,
      quantity: 16,
      tint: [0x8fd8ff, 0xd9f4ff],
      emitting: false,
    });
    burst.setDepth(y + 40);
    burst.explode(16);
    this.time.delayedCall(900, () => burst.destroy());
  }

  private celebrate(x: number, y: number) {
    const burst = this.add.particles(x, y - 30, 'particle', {
      speed: { min: 40, max: 160 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.55, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1000,
      quantity: 24,
      tint: [0x76dc92, 0xffe9a8, 0xffffff],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    burst.setDepth(y + 60);
    burst.explode(24);
    this.time.delayedCall(1400, () => burst.destroy());
  }

  private onInteract = () => {
    const state = getState();
    if (!this.scene.isActive()) return;
    if (state.ui.panel !== 'none' || state.ui.blackout || this.leaving) return;
    const target = this.nearest;
    if (!target) return;
    if (!target.enabled()) {
      sfx('warn');
      return;
    }
    target.run();
  };

  /* ----------------------------------------------------------
     Frame
     ---------------------------------------------------------- */
  update(time: number, delta: number) {
    this.player.update(time, delta);
    tickWorld(delta);

    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    const now = performance.now();
    if (now - this.promptAccumulator > 80) {
      this.promptAccumulator = now;
      let best: Zone | null = null;
      let bestDist = Infinity;
      for (const zone of this.zones) {
        const d = Phaser.Math.Distance.Between(px, py, zone.x, zone.y);
        if (d <= zone.radius && d < bestDist) {
          bestDist = d;
          best = zone;
        }
      }
      this.nearest = best;
      setPrompt(
        best && !this.leaving
          ? { id: best.id, label: best.label(), detail: best.detail?.(), enabled: best.enabled() }
          : null,
      );
    }

    this.syncAccumulator += delta;
    if (this.syncAccumulator > 180) {
      this.syncAccumulator = 0;
      this.syncBeds();
    }
  }

  /** Moves the astronaut instantly — used by dev tools and scripted moments. */
  teleportPlayer(x: number, y: number) {
    this.player.teleport(x, y);
    this.cameras.main.centerOn(x, y);
  }

  /** Mirrors bed state onto the sprites: soil darkens, plants grow and wilt. */
  private syncBeds() {
    const gh = getState().greenhouse;
    this.beds.forEach((view) => {
      const slot = gh.slots[view.index];
      if (!slot) return;

      // Raw regolith reads pale and grey; prepared medium is rich and darkens
      // further as it takes up water.
      if (!gh.containersReady) {
        view.soil.setTint(0xb8a894);
        view.soil.setAlpha(0.85);
      } else {
        const wet = Phaser.Math.Clamp(slot.water / 100, 0, 1);
        const shade = Math.round(255 - wet * 104);
        view.soil.setAlpha(1);
        view.soil.setTint(
          Phaser.Display.Color.GetColor(shade, Math.round(shade * 0.95), Math.round(shade * 0.88)),
        );
      }

      if (!slot.crop) {
        view.plant.setVisible(false);
        return;
      }
      const stage = stageForGrowth(slot.growth, slot.ready);
      const key = `crop_${slot.crop}_${stage}`;
      if (view.plant.texture.key !== key) view.plant.setTexture(key);
      view.plant.setVisible(true);

      // Wilt when neglected, perk up when looked after.
      const wilt = Phaser.Math.Clamp((70 - slot.health) / 70, 0, 1);
      view.droop = Phaser.Math.Linear(view.droop, wilt, 0.25);
      view.plant.setRotation(view.droop * 0.12);
      view.plant.setScale(1 - view.droop * 0.12, 1 - view.droop * 0.22);
      const dry = Math.round(255 - view.droop * 70);
      view.plant.setTint(Phaser.Display.Color.GetColor(255, dry, Math.round(dry * 0.85)));

      if (slot.ready) {
        view.plant.setY(BEDS[view.index].y - 8 + Math.sin(this.time.now / 420 + view.index) * 1.5);
      }
    });

    // Lamps follow their row switches.
    gh.lightRows.forEach((on, row) => {
      for (let i = 0; i < 2; i++) {
        const lampIndex = row * 2 + i;
        const lit = on && gh.power;
        this.lamps[lampIndex]?.setTexture(lit ? 'gh_lamp_on' : 'gh_lamp_off');
        this.cones[lampIndex]?.setAlpha(lit ? 0.42 + (gh.light / 100) * 0.3 : 0.04);
      }
      this.switches[row]?.setTexture(on ? 'gh_switch_on' : 'gh_switch_off');
    });
    void BED_ROWS;
  }
}
