import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';
import { GreenhouseScene } from './scenes/GreenhouseScene';

let game: Phaser.Game | null = null;

export function createGame(parent: HTMLElement): Phaser.Game {
  if (game) return game;
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1a0c06',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: parent.clientWidth || window.innerWidth,
      height: parent.clientHeight || window.innerHeight,
    },
    render: {
      antialias: true,
      roundPixels: true,
      powerPreference: 'high-performance',
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false, fixedStep: false },
    },
    fps: { target: 60, min: 30 },
    scene: [BootScene, WorldScene, GreenhouseScene],
  });
  return game;
}

export function destroyGame() {
  game?.destroy(true);
  game = null;
}

export function getGame() {
  return game;
}
