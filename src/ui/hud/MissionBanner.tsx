import { useEffect, useState } from 'react';
import { bus } from '../../game/bus';
import { Icon } from '../components/Icon';

interface Banner {
  id: number;
  code: string;
  title: string;
}

/** Full-width celebration that slides through without blocking play. */
export function MissionBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    let counter = 0;
    let timer = 0;
    const off = bus.on('ui:mission-complete', ({ code, title }) => {
      counter += 1;
      setBanner({ id: counter, code, title });
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setBanner(null), 3400);
    });
    return () => {
      off();
      window.clearTimeout(timer);
    };
  }, []);

  if (!banner) return null;

  return (
    <div key={banner.id} className="pointer-events-none absolute inset-x-0 top-28 z-30 flex justify-center">
      <div className="relative w-full max-w-2xl overflow-hidden anim-banner">
        <div className="absolute inset-y-0 left-0 w-1 bg-bio-400" />
        <div className="panel panel-glow flex items-center gap-4 border-bio-400/40 px-6 py-3.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-bio-400/50 bg-bio-600/15 text-bio-400">
            <Icon name="check" className="h-5 w-5" strokeWidth={2.6} />
          </div>
          <div className="min-w-0">
            <p className="label text-[9px] text-bio-400">{banner.code} complete</p>
            <p className="truncate font-display text-base uppercase tracking-[0.16em] text-white">
              {banner.title}
            </p>
          </div>
          <div className="ml-auto hidden sm:block">
            <span className="label text-[9px] text-slate-500">ARES HORIZON-7</span>
          </div>
        </div>
        <span className="pointer-events-none absolute inset-0 animate-sheen bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );
}
