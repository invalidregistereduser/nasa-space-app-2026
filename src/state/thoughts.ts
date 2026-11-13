import { bus } from '../game/bus';
import { getState } from './store';
import { sfx } from '../audio/AudioEngine';

/** Quiet first-person lines. They are flavour, never instructions. */
const IDLE: string[] = [
  'The quiet out here has a weight to it.',
  'Sol {sol}. Still standing.',
  'Dust on the visor again. Always dust.',
  'Earth is a dot from here. A very loud dot.',
  'Checking the wrist display out of habit. Everything still green.',
  'If the crew could see this view, they would complain about the walk.',
  'I keep listening for birds. There are no birds.',
  'The suit hums. I have started to find it comforting.',
];

const EVENT: Record<string, string[]> = {
  firstPlant: ['Seeds in Martian ground. Somebody had to be first.'],
  firstHarvest: ['First green thing I have seen in four sols. I am not going to eat it yet.'],
  harvest: ['Food I grew myself. On Mars. That will take a while to land.'],
  greenhouseBuilt: ['It holds pressure. It actually holds pressure.'],
  firstDiscovery: ['Somewhere to aim for. That helps more than it should.'],
  lowOxygen: ['Breathing shallower than I should be. Time to turn back.'],
  transmit: ['Somebody on Earth is about to have a very good morning.'],
  board: [
    'Seat is cold. Everything here is cold.',
    'Six wheels beat two boots.',
    'First drive on another planet. No traffic.',
  ],
};

let idleSeconds = 0;
let lastIndex = -1;

export function resetThoughts() {
  idleSeconds = 0;
  lastIndex = -1;
}

function emit(text: string) {
  const state = getState();
  bus.emit('ui:thought', { text: text.replace('{sol}', String(state.sol)) });
  sfx('thought');
}

/** Fires a specific line once, on a named beat. */
export function thought(key: keyof typeof EVENT) {
  const lines = EVENT[key];
  if (!lines?.length) return;
  emit(lines[Math.floor(Math.random() * lines.length)]);
  idleSeconds = 0;
}

/** Called from the sim tick: after a long quiet stretch, the mind wanders. */
export function tickThoughts(dt: number, moving: boolean) {
  const state = getState();
  if (state.ui.dialogue.length || state.ui.panel !== 'none') {
    idleSeconds = 0;
    return;
  }
  idleSeconds += moving ? dt * 0.25 : dt;
  if (idleSeconds < 26) return;
  idleSeconds = 0;
  let index = Math.floor(Math.random() * IDLE.length);
  if (index === lastIndex) index = (index + 1) % IDLE.length;
  lastIndex = index;
  emit(IDLE[index]);
}
