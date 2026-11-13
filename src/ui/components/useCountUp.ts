import { useEffect, useRef, useState } from 'react';

/**
 * Eases a displayed number toward its target so readouts tick rather than jump.
 * Falls straight through to the value when reduced motion is on.
 */
export function useCountUp(value: number, { duration = 450, reduce = false } = {}) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const start = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    from.current = shown;
    start.current = performance.now();
    cancelAnimationFrame(raf.current);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from.current + (value - from.current) * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, reduce]);

  return shown;
}
