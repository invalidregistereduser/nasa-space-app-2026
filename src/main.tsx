import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { bus } from './game/bus';
import { getGame } from './game/PhaserGame';
import { getState, setState } from './state/store';
import { live } from './state/live';
import * as gameplay from './state/gameplay';

/**
 * StrictMode is deliberately omitted: it double-invokes effects in development,
 * which would boot two Phaser game instances into the same container.
 */
const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}

// Development console helpers (stripped from production builds).
if (import.meta.env.DEV) {
  Object.assign(window, {
    __mars: { getState, setState, bus, live, gameplay, getGame },
  });
}
