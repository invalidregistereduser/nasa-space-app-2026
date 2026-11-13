import { useEffect, useReducer } from 'react';

/**
 * Per-frame values that must not round-trip through React state.
 * Phaser writes them, the HUD samples them at a low refresh rate.
 */
export interface LiveData {
  x: number;
  y: number;
  facing: 'up' | 'down' | 'left' | 'right';
  moving: boolean;
  running: boolean;
  /** True while the astronaut is inside a pressurised volume. */
  sheltered: boolean;
  /** Nearest named location id, or null. */
  area: string | null;
  waypoint: {
    x: number;
    y: number;
    label: string;
    distance: number;
    /** Screen-space position, used by the off-screen guidance arrow. */
    screenX: number;
    screenY: number;
    onScreen: boolean;
  } | null;
  /** Streamed terrain chunks currently alive, for the debug readout. */
  chunks: number;
  /** True while the player is inside the greenhouse. */
  indoors: boolean;
  /** True while the player is driving the surface truck. */
  riding: boolean;
  /** Bed the pointer is resting on inside the greenhouse, if any. */
  hoverBed: number | null;
  hoverX: number;
  hoverY: number;
  /** Where the astronaut is on screen, for thought bubbles. */
  playerScreenX: number;
  playerScreenY: number;
  fps: number;
  ready: boolean;
  /** Virtual joystick vector from the touch controls, -1..1. */
  touchX: number;
  touchY: number;
  touchRun: boolean;
}

export const live: LiveData = {
  x: 0,
  y: 0,
  facing: 'down',
  moving: false,
  running: false,
  sheltered: false,
  area: null,
  waypoint: null,
  fps: 60,
  chunks: 0,
  indoors: false,
  riding: false,
  hoverBed: null,
  hoverX: 0,
  hoverY: 0,
  playerScreenX: 0,
  playerScreenY: 0,
  ready: false,
  touchX: 0,
  touchY: 0,
  touchRun: false,
};

export function resetLive() {
  live.moving = false;
  live.running = false;
  live.sheltered = false;
  live.area = null;
  live.waypoint = null;
  live.ready = false;
  live.touchX = 0;
  live.touchY = 0;
  live.touchRun = false;
  live.indoors = false;
  live.riding = false;
  live.hoverBed = null;
}

/** Re-renders the calling component at a fixed rate so it can read `live`. */
export function useLive(hz = 6): LiveData {
  const [, force] = useReducer((c: number) => c + 1, 0);
  useEffect(() => {
    const id = window.setInterval(force, 1000 / hz);
    return () => window.clearInterval(id);
  }, [hz]);
  return live;
}
