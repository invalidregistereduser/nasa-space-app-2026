import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { sfx } from '../../audio/AudioEngine';

interface Props {
  title: string;
  subtitle?: string;
  icon?: string;
  onClose?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  accent?: 'nav' | 'bio' | 'mars';
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-5xl',
};

const ACCENTS = {
  nav: 'text-nav-300',
  bio: 'text-bio-400',
  mars: 'text-mars-300',
};

/** Shared chrome for every modal panel. */
export function PanelShell({
  title,
  subtitle,
  icon = 'info',
  onClose,
  children,
  footer,
  size = 'md',
  accent = 'nav',
}: Props) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-space-950/70 p-4 backdrop-blur-sm anim-fade">
      <div
        className={`panel anim-grow flex max-h-[88vh] w-full flex-col overflow-hidden ${SIZES[size]}`}
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-white/10 px-5 py-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg border border-nav-400/30 bg-nav-500/10">
            <Icon name={icon} className={`h-4.5 w-4.5 ${ACCENTS[accent]}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-sm uppercase tracking-[0.22em] text-white">{title}</h3>
            {subtitle && <p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p>}
          </div>
          {onClose && (
            <button
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:border-alert-500/50 hover:text-alert-500"
              onClick={() => {
                sfx('ui_close');
                onClose();
              }}
              aria-label="Close"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          )}
        </header>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-5">{children}</div>

        {footer && (
          <footer className="shrink-0 border-t border-white/10 px-5 py-3.5">{footer}</footer>
        )}
      </div>
    </div>
  );
}
