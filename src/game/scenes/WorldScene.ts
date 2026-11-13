import Phaser from 'phaser';
import { BUILD_SITE_BY_ID, SPAWN, STRUCTURES } from '../constants';
import { bus } from '../bus';
import { Backdrop } from '../systems/Backdrop';
import { ChunkManager } from '../systems/ChunkManager';
import { Effects } from '../systems/Effects';
import { Interactions } from '../systems/Interactions';
import { PlayerController } from '../systems/PlayerController';
import { WorldBuilder } from '../systems/WorldBuilder';
import { currentWaypoint } from '../waypoints';
import { getState, say, setPrompt, setState } from '../../state/store';
import { tickWorld } from '../../state/gameplay';
import { live } from '../../state/live';
import { revealDisc } from '../../state/fog';
import { audio, sfx } from '../../audio/AudioEngine';
import { Interactions as InteractionsNS } from '../systems/Interactions';

const DEPTH = {
  dust: 800000,
  overlay: 900020,
};

/** Centre of the authored mission area, used for the "nothing out there" hint. */
const MISSION_CENTRE = { x: 2600, y: 1900 };
const MISSION_RADIUS = 3200;

export class WorldScene extends Phaser.Scene {
  private world!: WorldBuilder;
  private backdrop!: Backdrop;
  private chunks!: ChunkManager;
  private player!: PlayerController;
  private interactions!: Interactions;
  private effects!: Effects;
  private greenhouseStage = 0;
  private slowAccumulator = 0;
  private exposureAccumulator = 0;
  private revealAccumulator = 0;
  private buildPlaying = false;
  /** True between pressing E at the greenhouse door and the scene actually swapping. */
  private entering = false;
  private baseZoom = 1;
  private focusTween?: Phaser.Tweens.Tween;

  constructor() {
    super('World');
  }

  create() {
    const state = getState();

    this.backdrop = new Backdrop(this);
    this.world = new WorldBuilder(this);
    this.world.build();

    const spawnX = state.playerX || SPAWN.x;
    const spawnY = state.playerY || SPAWN.y;
    this.player = new PlayerController(this, spawnX, spawnY, state.character);
    // A fresh scene always starts on foot, whatever the previous one was doing.
    live.riding = false;
    this.physics.add.collider(this.player.sprite, this.world.refs.solids);

    // The surface extends far past the mission area in every direction.
    this.physics.world.setBounds(-60000, this.world.surfaceTop, 120000, 120000);

    const cam = this.cameras.main;
    this.baseZoom = this.computeZoom();
    cam.setZoom(this.baseZoom);
    cam.startFollow(this.player.sprite, true, 0.09, 0.09);
    cam.setDeadzone(80, 60);
    cam.setRoundPixels(true);
    cam.setBackgroundColor(0xc98a5e);

    this.chunks = new ChunkManager(this, {
      solids: this.world.refs.solids,
      minY: this.world.surfaceTop,
      reserved: this.world.reserved,
    });
    this.backdrop.update();
    this.chunks.warmUp(cam.worldView);

    this.interactions = new Interactions(this, this.world);
    this.effects = new Effects(this, DEPTH.dust, DEPTH.overlay);

    this.restoreFromSave();
    this.wireEvents();

    this.scale.on('resize', this.handleResize, this);
    let disposed = false;
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      this.scale.off('resize', this.handleResize, this);
      bus.off('ui:interact', this.onInteract);
      bus.off('world:build-start', this.onBuildStart);
      bus.off('world:transmit', this.onTransmit);
      bus.off('player:blackout', this.onBlackout);
      bus.off('player:recovered', this.onRecovered);
      bus.off('camera:focus', this.onFocus);
      bus.off('world:enter-greenhouse', this.onEnterGreenhouse);
      bus.off('world:ride', this.onRide);
      this.effects.destroy();
      this.chunks.destroy();
      this.backdrop.destroy();
    };
    this.events.once('shutdown', dispose);
    this.events.once('destroy', dispose);

    cam.fadeIn(700, 201, 138, 94);
    bus.emit('game:ready');
  }

  private computeZoom() {
    const h = this.scale.gameSize.height;
    return Phaser.Math.Clamp(h / 700, 0.78, 1.5);
  }

  private handleResize() {
    this.baseZoom = this.computeZoom();
    this.cameras.main.setZoom(this.baseZoom);
  }

  /** Re-applies world state that was loaded from a save. */
  private restoreFromSave() {
    const state = getState();
    const gh = state.greenhouse;
    if (gh.built && gh.siteId) {
      const site = BUILD_SITE_BY_ID[gh.siteId];
      if (site) {
        this.world.placeGreenhouse(site.x, site.y, 3);
        this.greenhouseStage = 3;
        this.registry.set('greenhousePos', { x: site.x, y: site.y });
        this.world.refs.padSprites.forEach((pad, id) => {
          if (id !== gh.siteId) pad.setVisible(false);
          else pad.setAlpha(0.25);
        });
      }
    } else if (gh.siteId) {
      this.world.refs.padSprites.forEach((pad, id) => {
        pad.setTexture(id === gh.siteId ? 'site_pad_active' : 'site_pad');
      });
    }

    if (state.flags.transmitted && this.world.refs.transmitter) {
      this.world.refs.transmitter.setTexture('prop_transmitter_fixed');
    }
  }

  private wireEvents() {
    bus.on('ui:interact', this.onInteract);
    bus.on('world:build-start', this.onBuildStart);
    bus.on('world:transmit', this.onTransmit);
    bus.on('player:blackout', this.onBlackout);
    bus.on('player:recovered', this.onRecovered);
    bus.on('camera:focus', this.onFocus);
    bus.on('world:enter-greenhouse', this.onEnterGreenhouse);
    bus.on('world:ride', this.onRide);
    this.events.on('wake', this.onWake, this);
  }

  private onInteract = () => {
    const state = getState();
    if (!this.scene.isActive() || state.ui.panel !== 'none' || state.ui.blackout) return;
    this.interactions.interact();
  };

  /** Airlock transition into the greenhouse interior scene. */
  private onEnterGreenhouse = () => {
    // Without this guard a second E during the fade queues a second switch. The
    // scene sleeps with that timer pending, and it fires on the way back out —
    // dragging the player straight back indoors.
    if (this.entering) return;
    if (!this.scene.isActive() || !getState().greenhouse.built) return;
    this.entering = true;
    this.player.freeze(true);
    setPrompt(null);
    sfx('airlock');
    this.cameras.main.fadeOut(380, 18, 34, 26);
    this.time.delayedCall(420, () => {
      if (!this.scene.isActive()) return;
      this.scene.switch('Greenhouse');
    });
  };

  /** Climbing into or out of the truck. */
  private onRide = ({ riding }: { riding: boolean }) => {
    this.player.setRiding(riding);
    const rover = getState().rover;
    this.world.syncTruck(rover.x, rover.y, rover.fixed && !riding);
  };

  /** Coming back out of the greenhouse. */
  private onWake = () => {
    this.entering = false;
    live.indoors = false;
    this.player.freeze(false);
    this.cameras.main.fadeIn(520, 201, 138, 94);
    this.backdrop.update();
    this.chunks.warmUp(this.cameras.main.worldView);
    audio.setExposure(!live.sheltered);
  };

  /** Eases the camera in on something important, then back out. */
  private onFocus = (payload?: { zoom?: number; hold?: number }) => {
    if (getState().settings.reduceMotion) return;
    const cam = this.cameras.main;
    const zoom = this.baseZoom * (payload?.zoom ?? 1.12);
    this.focusTween?.stop();
    this.focusTween = this.tweens.add({
      targets: cam,
      zoom,
      duration: 420,
      ease: 'Sine.easeOut',
      yoyo: true,
      hold: payload?.hold ?? 900,
      onComplete: () => cam.setZoom(this.baseZoom),
    });
  };

  private onBuildStart = ({ siteId }: { siteId: string }) => {
    if (this.buildPlaying) return;
    const site = BUILD_SITE_BY_ID[siteId];
    if (!site) return;
    this.buildPlaying = true;
    this.player.freeze(true);
    this.registry.set('greenhousePos', { x: site.x, y: site.y });
    this.world.refs.padSprites.forEach((pad, id) => {
      if (id !== siteId) pad.setVisible(false);
    });

    this.effects.playBuildSequence(
      site.x,
      site.y,
      (stage) => {
        this.world.placeGreenhouse(site.x, site.y, stage);
        this.greenhouseStage = stage;
        bus.emit('world:build-stage', { stage });
      },
      () => {
        this.buildPlaying = false;
        this.player.freeze(false);
        this.cameras.main.startFollow(this.player.sprite, true, 0.09, 0.09);
        this.world.refs.padSprites.get(siteId)?.setAlpha(0.25);
        bus.emit('world:build-complete');
      },
    );
  };

  private onTransmit = () => {
    const tx = STRUCTURES.transmitter;
    this.player.freeze(true);
    this.world.refs.transmitter?.setTexture('prop_transmitter_fixed');
    this.effects.playTransmit(tx.x, tx.y, () => {
      /* the ending scene takes over from the store */
    });
  };

  private onBlackout = () => {
    this.player.freeze(true);
    this.cameras.main.fadeOut(900, 201, 138, 94);
    this.time.delayedCall(1100, () => {
      this.player.teleport(STRUCTURES.airlock.x, STRUCTURES.airlock.y + 40);
      this.cameras.main.centerOn(STRUCTURES.airlock.x, STRUCTURES.airlock.y);
      this.chunks.warmUp(this.cameras.main.worldView);
    });
    this.time.delayedCall(2300, () => this.cameras.main.fadeIn(800, 201, 138, 94));
  };

  private onRecovered = () => {
    this.player.freeze(false);
  };

  update(time: number, delta: number) {
    const state = getState();
    this.player.update(time, delta);
    tickWorld(delta);

    const cam = this.cameras.main;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    // Gentle look-ahead in the direction of travel.
    if (!this.buildPlaying) {
      const target = this.player.lookAhead();
      const offset = cam.followOffset;
      cam.setFollowOffset(
        Phaser.Math.Linear(offset.x, target.x, 0.04),
        Phaser.Math.Linear(offset.y, target.y, 0.04),
      );
    }

    this.backdrop.update();
    this.chunks.update(cam.worldView);
    this.interactions.update(delta, px, py);

    if (state.rover.fixed && !live.riding) {
      this.world.syncTruck(state.rover.x, state.rover.y, true);
    }

    const waypoint = currentWaypoint(state);
    this.effects.update(delta, px, py, waypoint);
    this.effects.setWaypoint(waypoint);
    live.waypoint = waypoint
      ? {
          x: waypoint.x,
          y: waypoint.y,
          label: waypoint.label,
          distance: InteractionsNS.distanceMetres(px, py, waypoint.x, waypoint.y),
          screenX: (waypoint.x - cam.worldView.x) * cam.zoom,
          screenY: (waypoint.y - cam.worldView.y) * cam.zoom,
          onScreen: cam.worldView.contains(waypoint.x, waypoint.y),
        }
      : null;

    // The map's explored overlay is driven straight off the player's path.
    this.revealAccumulator += delta;
    if (this.revealAccumulator > 240) {
      this.revealAccumulator = 0;
      revealDisc(px, py, 430);
    }

    this.slowAccumulator += delta;
    if (this.slowAccumulator > 450) {
      this.slowAccumulator = 0;
      this.syncGreenhouse(state);
      live.fps = Math.round(this.game.loop.actualFps);
      live.chunks = this.chunks.activeCount;
      this.checkOutskirts(px, py);
    }

    this.exposureAccumulator += delta;
    if (this.exposureAccumulator > 1500) {
      this.exposureAccumulator = 0;
      audio.setExposure(!live.sheltered);
      if (Math.abs(state.playerX - px) > 4) {
        setState({ playerX: px, playerY: py });
      }
    }
  }

  /** One gentle nudge if the player wanders well past the mission sites. */
  private checkOutskirts(px: number, py: number) {
    const distance = Phaser.Math.Distance.Between(px, py, MISSION_CENTRE.x, MISSION_CENTRE.y);
    if (distance < MISSION_RADIUS) return;
    say(
      [
        '{name}, there is nothing on my scanners out this way — just open regolith for a very long time.',
        'The mission sites are back toward the marker whenever you are ready.',
      ],
      { key: 'outskirts' },
    );
  }

  /** Moves the astronaut instantly — used by recovery, fast travel and dev tools. */
  teleportPlayer(x: number, y: number) {
    this.player.teleport(x, y);
    this.cameras.main.centerOn(x, y);
    this.backdrop.update();
    this.chunks.warmUp(this.cameras.main.worldView);
    setState({ playerX: x, playerY: y });
  }

  private syncGreenhouse(state: ReturnType<typeof getState>) {
    const gh = state.greenhouse;
    if (!gh.built || !this.world.refs.greenhouse || this.buildPlaying) return;
    const lit = gh.power && gh.slots.some((slot) => slot.crop !== null);
    const stage = lit ? 4 : 3;
    if (stage !== this.greenhouseStage) {
      this.greenhouseStage = stage;
      this.world.refs.greenhouse.setTexture(`prop_greenhouse_${stage}`);
    }
  }
}
