import { useEffect, useRef, useState } from 'react';
import { live } from '../../state/live';
import { bus } from '../../game/bus';
import { getState } from '../../state/store';
import { useCoarsePointer } from './useCoarsePointer';

/** On-screen stick and buttons, shown only on coarse-pointer devices. */
export function TouchControls() {
  const enabled = useCoarsePointer();
  const stickRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);

  useEffect(
    () => () => {
      live.touchX = 0;
      live.touchY = 0;
    },
    [],
  );

  if (!enabled) return null;

  const radius = 52;

  const updateFromEvent = (clientX: number, clientY: number) => {
    const el = stickRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
    }
    setKnob({ x: dx, y: dy });
    live.touchX = dx / radius;
    live.touchY = dy / radius;
    live.touchRun = dist > radius * 0.85;
  };

  const release = () => {
    pointerId.current = null;
    setKnob({ x: 0, y: 0 });
    live.touchX = 0;
    live.touchY = 0;
    live.touchRun = false;
  };

  return (
    <>
      <div
        ref={stickRef}
        className="pointer-events-auto absolute bottom-6 left-6 h-32 w-32 touch-none rounded-full border border-nav-300/30 bg-space-950/70 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.95)] backdrop-blur-md"
        onPointerDown={(e) => {
          pointerId.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          updateFromEvent(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (pointerId.current === e.pointerId) updateFromEvent(e.clientX, e.clientY);
        }}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <div className="absolute inset-4 rounded-full border border-white/5" />
        <div
          className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full border border-nav-300/70 bg-nav-500/40 shadow-[0_0_18px_-4px_rgba(56,220,248,0.9)]"
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>

      <div className="pointer-events-auto absolute bottom-6 right-6 flex flex-col items-end gap-3">
        <button
          className="grid h-20 w-20 place-items-center rounded-full border-2 border-nav-300/70 bg-nav-600/50 font-display text-base font-bold uppercase tracking-[0.1em] text-nav-100 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.95),0_0_24px_-8px_rgba(56,220,248,0.8)] backdrop-blur-md active:scale-95"
          onPointerDown={() => {
            if (getState().ui.panel === 'none') bus.emit('ui:interact');
          }}
        >
          E
        </button>
      </div>
    </>
  );
}

