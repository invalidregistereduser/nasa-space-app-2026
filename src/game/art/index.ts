import { buildAstronautSheet } from './astronaut';
import { createCropTextures } from './crops';
import { createInteriorTextures } from './interior';
import { createPropTextures } from './props';
import { createStructureTextures } from './structures';
import { createTerrainTextures } from './terrain';
import { createTruckTextures } from './truck';

export * from './astronaut';

/** Builds every texture the world needs. Called once from the boot scene. */
export function createAllTextures(scene: Phaser.Scene) {
  createTerrainTextures(scene);
  createInteriorTextures(scene);
  createCropTextures(scene);
  createStructureTextures(scene);
  createPropTextures(scene);
  createTruckTextures(scene);
  buildAstronautSheet(scene, 'astro_male', 'male');
  buildAstronautSheet(scene, 'astro_female', 'female');
}
