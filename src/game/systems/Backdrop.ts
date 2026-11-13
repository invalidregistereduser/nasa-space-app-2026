import Phaser from 'phaser';
import { WORLD } from '../constants';

const DEPTH = {
  sky: -3000,
  ridgeFar: -2900,
  ridgeMid: -2880,
  ridgeNear: -2860,
  ground: -2000,
  haze: -1980,
};

/**
 * The sky, the layered mountain horizon and the ground plane.
 *
 * All four layers follow the camera and scroll their own texture offsets, so
 * the world fills the screen in every direction and can never show an edge.
 */
export class Backdrop {
  private scene: Phaser.Scene;
  private sky: Phaser.GameObjects.Image;
  private ground: Phaser.GameObjects.TileSprite;
  private horizonHaze: Phaser.GameObjects.Image;
  private ridges: { sprite: Phaser.GameObjects.TileSprite; factor: number; y: number }[] = [];
  /** World y where the walkable ground plane begins. */
  readonly groundTop = WORLD.horizon - 110;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // The sky hangs from the horizon upward, so it covers any camera height.
    this.sky = scene.add
      .image(0, this.groundTop + 2, 'sky_band')
      .setOrigin(0, 1)
      .setDepth(DEPTH.sky);

    const layers: [string, number, number, number][] = [
      ['ridge_far', DEPTH.ridgeFar, 0.82, WORLD.horizon - 300],
      ['ridge_mid', DEPTH.ridgeMid, 0.68, WORLD.horizon - 222],
      ['ridge_near', DEPTH.ridgeNear, 0.5, WORLD.horizon - 146],
    ];
    layers.forEach(([key, depth, factor, y]) => {
      const sprite = scene.add
        .tileSprite(0, y, 64, 300, key)
        .setOrigin(0, 0)
        .setDepth(depth);
      this.ridges.push({ sprite, factor, y });
    });

    this.ground = scene.add
      .tileSprite(0, this.groundTop, 64, 64, 'ground')
      .setOrigin(0, 0)
      .setDepth(DEPTH.ground);

    // Warm haze where the ground meets the distant hills.
    this.horizonHaze = scene.add
      .image(0, this.groundTop - 60, 'horizon_haze')
      .setOrigin(0, 0)
      .setDepth(DEPTH.haze);
  }

  /** Re-anchors every layer to the camera. Call once per frame, before rendering. */
  update() {
    const view = this.scene.cameras.main.worldView;
    // A slow shimmer on the far hills reads as heat haze over the regolith.
    const shimmer = this.scene.time.now;
    const left = view.x - 4;
    const right = view.right + 4;
    const width = right - left;

    // Sky fills everything above the ground plane.
    const skyVisible = view.y < this.groundTop + 2;
    this.sky.setVisible(skyVisible);
    if (skyVisible) {
      const height = Math.max(600, this.groundTop + 2 - view.y + 200);
      this.sky.setPosition(left, this.groundTop + 2);
      this.sky.setDisplaySize(width, height);
    }

    // Parallax mountains, pinned to the horizon.
    for (const layer of this.ridges) {
      const visible = layer.y + 300 > view.y && layer.y < view.bottom;
      layer.sprite.setVisible(visible);
      if (!visible) continue;
      const drift = Math.sin(shimmer / (1400 + layer.factor * 900)) * (3.5 - layer.factor * 2);
      layer.sprite.setPosition(left, layer.y);
      layer.sprite.setSize(width, 300);
      layer.sprite.tilePositionX = left * layer.factor + drift;
    }

    const hazeVisible = this.groundTop + 120 > view.y && this.groundTop - 60 < view.bottom;
    this.horizonHaze.setVisible(hazeVisible);
    if (hazeVisible) {
      this.horizonHaze.setPosition(left, this.groundTop - 60);
      this.horizonHaze.setDisplaySize(width, 180);
    }

    // Infinite ground plane.
    const groundTop = Math.max(view.y - 4, this.groundTop);
    const groundHeight = Math.max(2, view.bottom + 4 - groundTop);
    this.ground.setPosition(left, groundTop);
    this.ground.setSize(width, groundHeight);
    this.ground.tilePositionX = left;
    this.ground.tilePositionY = groundTop;
  }

  destroy() {
    this.sky.destroy();
    this.ground.destroy();
    this.horizonHaze.destroy();
    this.ridges.forEach((r) => r.sprite.destroy());
    this.ridges = [];
  }
}
