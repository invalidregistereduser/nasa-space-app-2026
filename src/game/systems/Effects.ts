import Phaser from 'phaser';
import { canvasTex } from '../art/draw';
import { getState } from '../../state/store';
import { audio } from '../../audio/AudioEngine';
import { bus } from '../bus';

export interface WaypointView {
  x: number;
  y: number;
  label: string;
}

/** Beacons, the guidance arrow, ambient dust and the scripted set pieces. */
export class Effects {
  private scene: Phaser.Scene;
  private beacon: Phaser.GameObjects.Container | null = null;
  private beaconKey = '';
  private arrow: Phaser.GameObjects.Image;
  private dust: Phaser.GameObjects.Particles.ParticleEmitter;
  private windDrift = 0;
  private gustTimer = 9000;

  constructor(scene: Phaser.Scene, dustDepth: number, overlayDepth: number) {
    this.scene = scene;

    canvasTex(scene, 'nav_arrow', 64, 64, (ctx, w, h) => {
      ctx.translate(w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(-14, -16);
      ctx.lineTo(-7, 0);
      ctx.lineTo(-14, 16);
      ctx.closePath();
      const grad = ctx.createLinearGradient(-16, 0, 22, 0);
      grad.addColorStop(0, 'rgba(56,220,248,0.35)');
      grad.addColorStop(1, 'rgba(180,250,255,1)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(10,30,44,0.7)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    });

    this.arrow = scene.add
      .image(0, 0, 'nav_arrow')
      .setDepth(overlayDepth + 40)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.dust = scene.add.particles(0, 0, 'particle', {
      x: { min: -900, max: 900 },
      y: { min: -600, max: 600 },
      lifespan: { min: 3000, max: 6500 },
      speedX: { min: 10, max: 46 },
      speedY: { min: -8, max: 8 },
      scale: { min: 0.08, max: 0.34 },
      alpha: { start: 0.34, end: 0 },
      tint: [0xe0b183, 0xd59a6a, 0xf0d2b0],
      frequency: 90,
      quantity: 1,
      blendMode: Phaser.BlendModes.NORMAL,
    });
    this.dust.setDepth(dustDepth);

    bus.on('camera:shake', this.onShake);
  }

  /* ----------------------------------------------------------
     Waypoint beacon + arrow
     ---------------------------------------------------------- */
  setWaypoint(target: WaypointView | null) {
    const key = target ? `${Math.round(target.x)}:${Math.round(target.y)}` : '';
    if (key === this.beaconKey) return;
    this.beaconKey = key;

    if (this.beacon) {
      this.scene.tweens.killTweensOf(this.beacon.list);
      this.beacon.destroy(true);
      this.beacon = null;
    }
    if (!target) return;

    const container = this.scene.add.container(target.x, target.y).setDepth(target.y - 1);
    const ring = this.scene.add.image(0, 10, 'marker_ring').setScale(0.75);
    const column = this.scene.add
      .image(0, -80, 'glow')
      .setScale(0.4, 1.3)
      .setTint(0x38dcf8)
      .setAlpha(0.3)
      .setBlendMode(Phaser.BlendModes.ADD);
    const pulse = this.scene.add.image(0, 10, 'marker_ring').setScale(0.6).setAlpha(0.6);
    container.add([column, pulse, ring]);

    this.scene.tweens.add({
      targets: pulse,
      scale: 1.5,
      alpha: 0,
      duration: 1900,
      repeat: -1,
      ease: 'Cubic.easeOut',
    });
    this.scene.tweens.add({
      targets: column,
      alpha: { from: 0.18, to: 0.42 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.beacon = container;
  }

  update(delta: number, px: number, py: number, waypoint: WaypointView | null) {
    this.windDrift += delta;
    const cam = this.scene.cameras.main;
    this.dust.setPosition(cam.midPoint.x, cam.midPoint.y);

    this.gustTimer -= delta;
    if (this.gustTimer <= 0) {
      this.gustTimer = 14000 + Math.random() * 16000;
      this.playGust();
    }

    // Guidance itself is drawn by the HUD; the world only carries the beacon.
    void waypoint;
    void px;
    void py;
    this.arrow.setAlpha(0);
  }

  /** A soft wall of dust drifting across the view. */
  private playGust() {
    if (getState().settings.reduceMotion) return;
    const scene = this.scene;
    const view = scene.cameras.main.worldView;
    const fromLeft = Math.random() > 0.4;
    const x = fromLeft ? view.x - 160 : view.right + 160;
    const gust = scene.add.particles(x, view.centerY, 'particle', {
      x: { min: -120, max: 120 },
      y: { min: -view.height * 0.6, max: view.height * 0.6 },
      speedX: fromLeft ? { min: 150, max: 300 } : { min: -300, max: -150 },
      speedY: { min: -14, max: 14 },
      scale: { min: 0.2, max: 0.9 },
      alpha: { start: 0.3, end: 0 },
      lifespan: { min: 2200, max: 4200 },
      tint: [0xe0b183, 0xf0d2b0, 0xd59a6a],
      frequency: 24,
      quantity: 2,
    });
    gust.setDepth(899000);
    audio.gust();
    scene.time.delayedCall(2600, () => gust.stop());
    scene.time.delayedCall(7200, () => gust.destroy());
  }

  /* ----------------------------------------------------------
     Scripted sequences
     ---------------------------------------------------------- */
  shake(duration = 300, intensity = 0.006) {
    if (!getState().settings.screenShake) return;
    this.scene.cameras.main.shake(duration, intensity);
  }

  /** Staged greenhouse assembly with dust, sparks and a camera move. */
  playBuildSequence(
    x: number,
    y: number,
    onStage: (stage: number) => void,
    onComplete: () => void,
  ) {
    const scene = this.scene;
    const cam = scene.cameras.main;
    cam.stopFollow();
    cam.pan(x, y - 40, 700, 'Sine.easeInOut');

    const dustBurst = () => {
      const burst = scene.add.particles(x, y + 20, 'particle', {
        speed: { min: 40, max: 180 },
        angle: { min: 180, max: 360 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.55, end: 0 },
        lifespan: 900,
        quantity: 22,
        tint: [0xd59a6a, 0xe8c49a],
        emitting: false,
      });
      burst.setDepth(y + 5);
      burst.explode(22);
      scene.time.delayedCall(1400, () => burst.destroy());
    };

    const stages = [1, 2, 3, 4];
    stages.forEach((stage, i) => {
      scene.time.delayedCall(700 + i * 850, () => {
        onStage(stage);
        dustBurst();
        this.shake(220, 0.005);
      });
    });

    scene.time.delayedCall(700 + stages.length * 850 + 400, () => {
      const flash = scene.add
        .image(x, y - 30, 'glow')
        .setScale(3)
        .setTint(0x76dc92)
        .setAlpha(0)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(y + 6);
      scene.tweens.add({
        targets: flash,
        alpha: { from: 0.8, to: 0 },
        scale: 5,
        duration: 1200,
        onComplete: () => flash.destroy(),
      });
      onComplete();
    });
  }

  /** The emergency broadcast finale. */
  playTransmit(x: number, y: number, onDone: () => void) {
    const scene = this.scene;
    const cam = scene.cameras.main;
    cam.stopFollow();
    cam.pan(x, y - 90, 900, 'Sine.easeInOut');
    cam.zoomTo(1.25, 1600, 'Sine.easeInOut');

    const column = scene.add
      .image(x, y - 150, 'glow')
      .setScale(0.6, 2)
      .setTint(0x38dcf8)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(1000000);
    scene.tweens.add({
      targets: column,
      alpha: { from: 0, to: 0.9 },
      scaleX: { from: 0.3, to: 1.2 },
      scaleY: { from: 1, to: 5 },
      y: y - 420,
      duration: 2600,
      ease: 'Cubic.easeOut',
    });

    for (let i = 0; i < 4; i++) {
      scene.time.delayedCall(400 + i * 420, () => {
        const ring = scene.add
          .image(x, y - 110, 'marker_ring')
          .setScale(0.4)
          .setAlpha(0.9)
          .setDepth(999999)
          .setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({
          targets: ring,
          scale: 5,
          alpha: 0,
          duration: 1800,
          ease: 'Cubic.easeOut',
          onComplete: () => ring.destroy(),
        });
      });
    }

    this.shake(900, 0.004);
    scene.time.delayedCall(2800, () => {
      cam.flash(900, 180, 240, 255);
      onDone();
    });
  }

  destroy() {
    this.dust.destroy();
    this.arrow.destroy();
    this.beacon?.destroy(true);
    bus.off('camera:shake', this.onShake);
  }

  private onShake = (p: { duration: number; intensity: number }) => {
    this.shake(p.duration, p.intensity);
  };
}
