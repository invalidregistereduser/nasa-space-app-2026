import { useEffect, useRef } from 'react';
import type { CharacterId } from '../../types';
import { drawAstronautPose, FRAME_H, FRAME_W, type Dir } from '../../game/art';

interface Props {
  kind: CharacterId;
  /** Pixel scale applied to the 64x80 source frame. */
  scale?: number;
  animated?: boolean;
  /** Slowly turns the astronaut on the spot, like a rotating display model. */
  rotate?: boolean;
  dir?: Dir;
  className?: string;
}

const TURN_ORDER: Dir[] = ['down', 'right', 'up', 'left'];

/** Live-rendered astronaut preview that shares the in-game sprite code. */
export function CharacterPreview({
  kind,
  scale = 3,
  animated = true,
  rotate = false,
  dir = 'down',
  className,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = FRAME_W * scale * dpr;
    canvas.height = FRAME_H * scale * dpr;
    canvas.style.width = `${FRAME_W * scale}px`;
    canvas.style.height = `${FRAME_H * scale}px`;

    let raf = 0;
    let last = performance.now();
    let frameTime = 0;
    let turnTime = 0;
    let col = 0;
    let turn = 0;
    const cycle = [0, 1];

    const render = (now: number) => {
      const dt = now - last;
      last = now;
      frameTime += dt;
      const step = animated ? 620 : Infinity;
      if (frameTime > step) {
        frameTime = 0;
        col = (col + 1) % cycle.length;
      }
      if (rotate) {
        turnTime += dt;
        if (turnTime > 1900) {
          turnTime = 0;
          turn = (turn + 1) % TURN_ORDER.length;
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, FRAME_W * scale, FRAME_H * scale);
      drawAstronautPose(ctx, kind, rotate ? TURN_ORDER[turn] : dir, cycle[col], scale);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [kind, scale, animated, rotate, dir]);

  return <canvas ref={ref} className={className} />;
}
