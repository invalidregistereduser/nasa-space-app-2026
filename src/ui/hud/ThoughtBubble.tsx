import { useEffect, useState } from 'react';
import { bus } from '../../game/bus';
import { live } from '../../state/live';
import { hudBusy, useGame } from '../../state/store';

interface Bubble {
  id: number;
  text: string;
  x: number;
  y: number;
}

/** A passing thought, floating just above the astronaut. */
export function ThoughtBubble() {
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const busy = hudBusy(useGame());

  // A thought gives way the moment anything else needs the screen.
  useEffect(() => {
    if (busy) setBubble(null);
  }, [busy]);

  useEffect(() => {
    let counter = 0;
    let timer = 0;
    const off = bus.on('ui:thought', ({ text }) => {
      counter += 1;
      setBubble({
        id: counter,
        text,
        x: live.playerScreenX || window.innerWidth / 2,
        y: live.playerScreenY || window.innerHeight / 2,
      });
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setBubble(null), 5200);
    });
    return () => {
      off();
      window.clearTimeout(timer);
    };
  }, []);

  if (!bubble || busy) return null;

  const x = Math.min(Math.max(bubble.x, 180), window.innerWidth - 180);
  const y = Math.min(Math.max(bubble.y - 90, 110), window.innerHeight - 160);

  return (
    <div
      key={bubble.id}
      className="pointer-events-none absolute z-20 anim-thought"
      style={{ left: x, top: y, transform: 'translate(-50%,-100%)' }}
    >
      <div className="glass-soft relative max-w-[18rem] rounded-2xl px-4 py-2.5">
        <p className="text-[12.5px] italic leading-snug text-slate-200/90">“{bubble.text}”</p>
        <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[3px] bg-space-800/80 ring-1 ring-white/10" />
      </div>
      <div className="mx-auto mt-2 flex w-8 justify-between">
        <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        <span className="h-1 w-1 rounded-full bg-white/15" />
      </div>
    </div>
  );
}
