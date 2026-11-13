import { useEffect, useState } from 'react';
import { bus } from '../../game/bus';
import { Icon } from '../components/Icon';

/** Quiet confirmation that progress was written. */
export function SaveIndicator() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer = 0;
    const off = bus.on('ui:saving', () => {
      setVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setVisible(false), 1500);
    });
    return () => {
      off();
      window.clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;
  return (
    <div className="panel panel-tight pointer-events-none flex items-center gap-2 px-3 py-1.5 anim-fade">
      <Icon name="save" className="h-3.5 w-3.5 animate-blink text-nav-300" />
      <span className="label text-[9px] text-slate-400">Saving…</span>
    </div>
  );
}
