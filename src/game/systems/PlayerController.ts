import Phaser from 'phaser';
import type { CharacterId } from '../../types';
import { COLS, DIRS, FIDGET_FRAMES, FRAME_H, FRAME_W, type Dir } from '../art/astronaut';
import { TRUCK_COLS, TRUCK_DIRS, TRUCK_H, TRUCK_W } from '../art/truck';
import { PLAYER, ROUGH_TERRAIN, STRUCTURES } from '../constants';
import { live } from '../../state/live';
import { getState, setFlag, toast } from '../../state/store';
import { sfx } from '../../audio/AudioEngine';

const FOOTPRINT_POOL = 70;
/** The truck is about twice walking pace — enough to feel worth the walk back to it. */
const TRUCK_SPEED = 2.05;
const TRUCK_SCALE = 1.3;
const FOOTPRINT_SPACING = 46;

export class PlayerController {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private textureKey: string;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private facing: Dir = 'down';
  private footprints: Phaser.GameObjects.Image[] = [];
  private footIndex = 0;
  private sinceFootprint = 0;
  private leftFoot = false;
  private stepTimer = 0;
  private frozen = false;
  private travelled = 0;
  private idleSeconds = 0;
  private fidgeting = false;
  /** Inside the greenhouse the astronaut is sheltered and off the surface map. */
  indoor = false;
  /** Driving the surface truck: faster, no footprints, no fidgeting. */
  private riding = false;
  private roughWarn = 0;
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  private glint!: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, character: CharacterId) {
    this.scene = scene;
    this.textureKey = character === 'female' ? 'astro_female' : 'astro_male';
    this.createAnimations();

    this.sprite = scene.physics.add.sprite(x, y, this.textureKey, 0);
    this.sprite.setDepth(y);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setScale(PLAYER.scale);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(PLAYER.bodyRadius, FRAME_W / 2 - PLAYER.bodyRadius, FRAME_H - PLAYER.bodyOffsetY - PLAYER.bodyRadius);
    body.setCollideWorldBounds(true);

    for (let i = 0; i < FOOTPRINT_POOL; i++) {
      const print = scene.add.image(-500, -500, 'footprint').setAlpha(0).setDepth(-650);
      this.footprints.push(print);
    }

    this.dust = scene.add.particles(0, 0, 'particle', {
      speed: { min: 8, max: 34 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.26, end: 0 },
      alpha: { start: 0.42, end: 0 },
      lifespan: { min: 420, max: 820 },
      tint: [0xd9a071, 0xe8c49a],
      emitting: false,
    });
    this.dust.setDepth(y - 1);

    this.glint = scene.add
      .image(x, y - 18, 'glow')
      .setScale(0.32)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(y + 1);
    scene.tweens.add({
      targets: this.glint,
      alpha: { from: 0, to: 0.55 },
      duration: 240,
      yoyo: true,
      repeat: -1,
      repeatDelay: 6200,
      ease: 'Sine.easeOut',
    });

    this.bindInput();
    this.play('idle', 'down');
  }

  private createAnimations() {
    const key = this.textureKey;
    DIRS.forEach((dir, row) => {
      const base = row * COLS;
      const idleKey = `${key}-idle-${dir}`;
      if (!this.scene.anims.exists(idleKey)) {
        this.scene.anims.create({
          key: idleKey,
          frames: [{ key, frame: base }, { key, frame: base + 1 }],
          frameRate: 1.6,
          repeat: -1,
        });
      }
      const driveKey = `truck-drive-${dir}`;
      if (!this.scene.anims.exists(driveKey)) {
        const tbase = TRUCK_DIRS.indexOf(dir) * TRUCK_COLS;
        this.scene.anims.create({
          key: driveKey,
          frames: Array.from({ length: TRUCK_COLS }, (_, i) => ({ key: 'truck', frame: tbase + i })),
          frameRate: 11,
          repeat: -1,
        });
      }
      const walkKey = `${key}-walk-${dir}`;
      if (!this.scene.anims.exists(walkKey)) {
        this.scene.anims.create({
          key: walkKey,
          frames: Array.from({ length: 6 }, (_, i) => ({ key, frame: base + 2 + i })),
          frameRate: 11,
          repeat: -1,
        });
      }
    });

    // Small signs of life when the astronaut is left standing still.
    const front = DIRS.indexOf('down') * COLS;
    const fidgets: [string, number[], number][] = [
      ['stretch', [FIDGET_FRAMES.stretchA, FIDGET_FRAMES.stretchB, FIDGET_FRAMES.stretchB, FIDGET_FRAMES.stretchA], 2],
      ['sky', [FIDGET_FRAMES.sky, FIDGET_FRAMES.sky], 0.5],
      ['wrist', [FIDGET_FRAMES.wrist, FIDGET_FRAMES.wrist], 0.6],
    ];
    fidgets.forEach(([name, frames, rate]) => {
      const animKey = `${key}-fidget-${name}`;
      if (this.scene.anims.exists(animKey)) return;
      this.scene.anims.create({
        key: animKey,
        frames: frames.map((f) => ({ key, frame: front + f })),
        frameRate: rate,
        repeat: 0,
      });
    });
  }

  private bindInput() {
    const kb = this.scene.input.keyboard;
    if (!kb) return;
    this.cursors = kb.createCursorKeys();
    this.keys = kb.addKeys('W,A,S,D,SHIFT') as Record<string, Phaser.Input.Keyboard.Key>;
  }

  private play(kind: 'idle' | 'walk', dir: Dir) {
    if (this.riding) {
      const driveKey = `truck-drive-${dir}`;
      if (this.sprite.anims.currentAnim?.key !== driveKey) this.sprite.play(driveKey, true);
      // Parked wheels do not turn.
      if (kind === 'idle') this.sprite.anims.pause();
      else this.sprite.anims.resume();
      return;
    }
    const key = `${this.textureKey}-${kind}-${dir}`;
    if (this.sprite.anims.currentAnim?.key !== key) this.sprite.play(key, true);
  }

  get driving() {
    return this.riding;
  }

  /** Climbs into or out of the truck. The sprite becomes the vehicle. */
  setRiding(value: boolean) {
    if (this.riding === value) return;
    this.riding = value;
    live.riding = value;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (value) {
      this.fidgeting = false;
      this.sprite.setTexture('truck', 0);
      this.sprite.setScale(TRUCK_SCALE);
      body.setSize(TRUCK_W * 0.62, TRUCK_H * 0.34, false);
      body.setOffset(TRUCK_W * 0.19, TRUCK_H * 0.52);
      this.glint.setAlpha(0).setVisible(false);
    } else {
      this.sprite.setTexture(this.textureKey, 0);
      this.sprite.setScale(PLAYER.scale);
      body.setCircle(
        PLAYER.bodyRadius,
        FRAME_W / 2 - PLAYER.bodyRadius,
        FRAME_H - PLAYER.bodyOffsetY - PLAYER.bodyRadius,
      );
      this.glint.setVisible(true);
    }
    this.sprite.anims.resume();
    this.play('idle', this.facing);
  }

  freeze(value: boolean) {
    this.frozen = value;
    if (value) {
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      this.play('idle', this.facing);
    }
  }

  /** True when that point lies in ground the truck cannot cross. */
  private roughAhead(x: number, y: number) {
    for (const zone of ROUGH_TERRAIN) {
      if (Phaser.Math.Distance.Between(x, y, zone.x, zone.y) < zone.r) return true;
    }
    return false;
  }

  private warnRough(dt: number) {
    this.roughWarn -= dt;
    if (this.roughWarn > 0) return;
    this.roughWarn = 6;
    sfx('warn');
    toast({ kind: 'warning', title: 'Too rough for the truck', ttl: 2800 });
  }

  teleport(x: number, y: number) {
    this.sprite.setPosition(x, y);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.reset(x, y);
  }

  update(_time: number, delta: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const dt = delta / 1000;
    const state = getState();
    const uiBlocking = state.ui.panel !== 'none' || state.ui.paused || state.ui.blackout;

    let vx = 0;
    let vy = 0;

    if (!this.frozen && !uiBlocking) {
      const left = this.cursors?.left.isDown || this.keys.A?.isDown;
      const right = this.cursors?.right.isDown || this.keys.D?.isDown;
      const up = this.cursors?.up.isDown || this.keys.W?.isDown;
      const down = this.cursors?.down.isDown || this.keys.S?.isDown;

      if (left) vx -= 1;
      if (right) vx += 1;
      if (up) vy -= 1;
      if (down) vy += 1;

      // Touch joystick.
      if (Math.abs(live.touchX) > 0.12 || Math.abs(live.touchY) > 0.12) {
        vx = live.touchX;
        vy = live.touchY;
      }
    }

    const magnitude = Math.hypot(vx, vy);
    const running =
      magnitude > 0 && ((this.keys.SHIFT?.isDown ?? false) || live.touchRun) && !uiBlocking;
    const speed = this.riding
      ? PLAYER.speed * TRUCK_SPEED * (running ? 1.18 : 1)
      : PLAYER.speed * (running ? PLAYER.runMultiplier : 1);

    if (magnitude > 0) {
      vx = (vx / magnitude) * speed;
      vy = (vy / magnitude) * speed;
      if (this.riding) {
        // The truck stops at broken ground; the last stretch is always on foot.
        const blocked = this.roughAhead(this.sprite.x + vx * dt * 3, this.sprite.y + vy * dt * 3);
        if (blocked) {
          vx = 0;
          vy = 0;
          this.warnRough(dt);
        }
      }
      body.setVelocity(vx, vy);

      // Facing follows the dominant axis, with a bias toward the previous one.
      if (Math.abs(vx) > Math.abs(vy) * 1.08) this.facing = vx > 0 ? 'right' : 'left';
      else this.facing = vy > 0 ? 'down' : 'up';
      this.play('walk', this.facing);
      if (!this.riding) this.sprite.anims.msPerFrame = running ? 72 : 92;
    } else {
      body.setVelocity(0, 0);
      if (!this.fidgeting) this.play('idle', this.facing);
    }

    const moving = magnitude > 0 && (Math.abs(body.velocity.x) > 4 || Math.abs(body.velocity.y) > 4);

    // Idle fidgets: stretch, look up at the sky, check the wrist display.
    if (moving || this.frozen) {
      this.idleSeconds = 0;
      if (this.fidgeting) {
        this.fidgeting = false;
        this.sprite.stop();
      }
    } else if (!this.fidgeting && !this.riding) {
      this.idleSeconds += dt;
      if (this.idleSeconds > 9 + Math.random() * 5) {
        this.idleSeconds = 0;
        this.startFidget();
      }
    }
    this.sprite.setDepth(this.sprite.y);
    this.glint.setPosition(this.sprite.x + 4, this.sprite.y - 18).setDepth(this.sprite.y + 1);

    // Footsteps and prints — or a rooster tail of dust behind the truck.
    if (moving) {
      const travelled = Math.hypot(body.velocity.x, body.velocity.y) * dt;
      this.sinceFootprint += travelled;
      this.travelled += travelled;
      if (this.travelled > 100 && !getState().flags.hasMoved) setFlag('hasMoved');
      if (this.riding) {
        if (this.sinceFootprint >= 26) {
          this.sinceFootprint = 0;
          this.dust.setDepth(this.sprite.y - 1);
          this.dust.emitParticleAt(
            this.sprite.x - Math.sign(body.velocity.x) * 22,
            this.sprite.y + 24,
            3,
          );
        }
      } else {
        this.stepTimer -= dt;
        if (this.stepTimer <= 0) {
          this.stepTimer = running ? 0.3 : 0.42;
          sfx('footstep');
        }
        if (this.sinceFootprint >= FOOTPRINT_SPACING) {
          this.sinceFootprint = 0;
          this.dropFootprint(body.velocity.x, body.velocity.y);
        }
      }
    }

    // Publish live values for React and other systems.
    if (!this.indoor) {
      live.x = this.sprite.x;
      live.y = this.sprite.y;
      live.sheltered = this.isSheltered(state.greenhouse.built, state.greenhouse.siteId);
    } else {
      live.sheltered = true;
    }
    live.facing = this.facing;
    live.moving = moving;
    live.running = running;
    live.ready = true;

    const cam = this.scene.cameras.main;
    live.playerScreenX = (this.sprite.x - cam.worldView.x) * cam.zoom;
    live.playerScreenY = (this.sprite.y - cam.worldView.y) * cam.zoom;
  }

  private isSheltered(greenhouseBuilt: boolean, siteId: string | null) {
    const sx = STRUCTURES.shelter.x;
    const sy = STRUCTURES.shelter.y + 40;
    if (Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, sx, sy) < 150) return true;
    if (greenhouseBuilt && siteId) {
      const site = (this.scene.registry.get('greenhousePos') ?? null) as { x: number; y: number } | null;
      if (site && Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, site.x, site.y) < 130) {
        return true;
      }
    }
    return false;
  }

  /** Plays one of the small standing-around animations, then returns to idle. */
  private startFidget() {
    const names = ['stretch', 'sky', 'wrist'];
    const name = names[Math.floor(Math.random() * names.length)];
    this.facing = 'down';
    this.fidgeting = true;
    const animKey = `${this.textureKey}-fidget-${name}`;
    this.sprite.play(animKey, true);
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.fidgeting = false;
      this.play('idle', this.facing);
    });
  }

  /** Camera follow offset that pushes the view ahead of the walk direction. */
  lookAhead() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    if (speed < 6) return { x: 0, y: 0 };
    return { x: (-body.velocity.x / speed) * 70, y: (-body.velocity.y / speed) * 52 };
  }

  private dropFootprint(vx: number, vy: number) {
    const print = this.footprints[this.footIndex];
    this.footIndex = (this.footIndex + 1) % this.footprints.length;
    const angle = Math.atan2(vy, vx) + Math.PI / 2;
    const side = this.leftFoot ? -1 : 1;
    this.leftFoot = !this.leftFoot;
    const offX = Math.cos(angle + Math.PI / 2) * 7 * side;
    const offY = Math.sin(angle + Math.PI / 2) * 7 * side;

    this.dust.setDepth(this.sprite.y - 1);
    this.dust.emitParticleAt(this.sprite.x + offX, this.sprite.y + 24 + offY, 2);

    this.scene.tweens.killTweensOf(print);
    print.setPosition(this.sprite.x + offX, this.sprite.y + 26 + offY);
    print.setRotation(angle);
    print.setAlpha(0.5);
    print.setScale(0.95);
    this.scene.tweens.add({
      targets: print,
      alpha: 0,
      duration: 16000,
      ease: 'Quad.easeIn',
    });
  }
}
