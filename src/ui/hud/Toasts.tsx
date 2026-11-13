import { Icon } from '../components/Icon';
import { useGame } from '../../state/store';

const KIND = {
  info: { icon: 'info', accent: 'text-nav-300', ring: 'border-nav-400/40' },
  item: { icon: 'box', accent: 'text-mars-300', ring: 'border-mars-400/40' },
  success: { icon: 'check', accent: 'text-bio-400', ring: 'border-bio-400/40' },
  warning: { icon: 'warning', accent: 'text-warn-500', ring: 'border-warn-500/40' },
  science: { icon: 'science', accent: 'text-nav-200', ring: 'border-nav-300/40' },
};

export function Toasts() {
  const state = useGame();
  if (!state.ui.toasts.length) return null;

  return (
    <div className="pointer-events-none flex w-[min(24rem,calc(100vw-2rem))] flex-col items-center gap-2">
      {state.ui.toasts.map((toast) => {
        const kind = KIND[toast.kind] ?? KIND.info;
        return (
          <div
            key={toast.id}
            className={`panel panel-tight anim-rise flex w-full items-start gap-3 px-3.5 py-2.5 ${kind.ring}`}
          >
            <div className={`mt-0.5 shrink-0 ${kind.accent}`}>
              <Icon name={toast.icon ?? kind.icon} className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-tight text-slate-100">
                {toast.title}
              </p>
              {toast.text && (
                <p className="mt-0.5 text-[11.5px] leading-snug text-slate-400">{toast.text}</p>
              )}
              {toast.note && (
                <p className="label mt-1 text-[8.5px] text-nav-300/80">{toast.note}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
