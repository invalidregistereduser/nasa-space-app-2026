import { fileInLog, getState, setFlag } from './store';

export interface Transmission {
  id: string;
  /** Delivered once the player reaches this mission index. */
  after: number;
  speaker: string;
  lines: string[];
}

/**
 * Earth is out of contact, but the suit still holds messages recorded before
 * launch, and the relay buffer dribbles out fragments of old traffic.
 */
export const TRANSMISSIONS: Transmission[] = [
  {
    id: 't_launch',
    after: 1,
    speaker: 'STORED MESSAGE · FAMILY',
    lines: [
      'Recorded 11 months ago, the night before launch.',
      '“Okay — they said I get sixty seconds, so. We are all very proud and slightly furious with you.”',
      '“Eat something green. Call when you can. We love you.”',
    ],
  },
  {
    id: 't_houston',
    after: 3,
    speaker: 'RELAY BUFFER · HOUSTON',
    lines: [
      'Fragment recovered from the relay buffer, timestamp corrupted.',
      '“…HORIZON-7, Houston. We show your descent off-nominal. We are listening on every band…”',
      '“…whatever you have down there, make it last. We are not giving up on you.”',
    ],
  },
  {
    id: 't_botany',
    after: 6,
    speaker: 'STORED MESSAGE · BOTANY TEAM',
    lines: [
      'Pre-recorded briefing, filed under GREENHOUSE / FIRST LIGHT.',
      '“If you are hearing this, the module is up. Congratulations — that is the hardest part.”',
      '“Keep the medium damp, not wet. Plants forgive almost everything except drowning.”',
    ],
  },
  {
    id: 't_home',
    after: 8,
    speaker: 'STORED MESSAGE · FAMILY',
    lines: [
      '“The tomatoes on the balcony died again. I am telling you so you feel better about yours.”',
      '“Dad put your mission patch on the fridge. It is next to a parking ticket. He is very proud.”',
    ],
  },
  {
    id: 't_first_food',
    after: 10,
    speaker: 'RELAY BUFFER · HOUSTON',
    lines: [
      '“…confirm you have a harvest? Say again, over…”',
      'The fragment cuts out there. Somewhere on Earth, somebody is shouting about it.',
    ],
  },
  {
    id: 't_crew',
    after: 11,
    speaker: 'CREW BEACON · FAINT',
    lines: [
      'Four beacons, all still transmitting. No voice, just the carrier tone.',
      'They are out there, {name}. One signal at a time.',
    ],
  },
];

/**
 * Files anything unlocked by reaching a mission index in the radio log (L).
 * Nothing pops up: the menu button shows a dot until the log has been read.
 */
export function deliverTransmissions(missionIndex: number) {
  const state = getState();
  TRANSMISSIONS.filter((t) => t.after === missionIndex).forEach((t) => {
    if (state.flags[`tx_${t.id}`]) return;
    setFlag(`tx_${t.id}`);
    fileInLog(t.speaker, t.lines);
  });
}
