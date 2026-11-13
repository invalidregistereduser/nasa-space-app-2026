import { useEffect, useState } from 'react';

/**
 * True on devices driven by touch. Drives the on-screen stick and hides the
 * keyboard hints that would otherwise sit under the player's thumbs.
 */
export function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const apply = () => setCoarse(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return coarse;
}
