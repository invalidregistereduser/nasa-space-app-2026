import Phaser from 'phaser';
import { createAllTextures } from '../art';

/** Generates every texture procedurally, then hands over to the world. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    const started = performance.now();
    createAllTextures(this);
    const ms = Math.round(performance.now() - started);
    if (import.meta.env.DEV) console.info(`[mars] generated textures in ${ms}ms`);
    this.scene.start('World');
  }
}
