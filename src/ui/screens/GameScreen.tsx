import { useEffect, useRef, useState } from 'react';
import { HUD } from '../hud/HUD';
import { InventoryPanel } from '../panels/InventoryPanel';
import { MapPanel } from '../panels/MapPanel';
import { NavPanel } from '../panels/NavPanel';
import { GreenhousePanel } from '../panels/GreenhousePanel';
import { BuildPanel } from '../panels/BuildPanel';
import { PausePanel } from '../panels/PausePanel';
import { SettingsPanel } from '../panels/SettingsPanel';
import { LogPanel } from '../panels/LogPanel';
import { SeedPanel } from '../panels/SeedPanel';
import { Icon } from '../components/Icon';
import { bus } from '../../game/bus';
import { createGame, destroyGame } from '../../game/PhaserGame';
import { closePanel, getState, openPanel, togglePanel, useGame } from '../../state/store';
import { sfx } from '../../audio/AudioEngine';

function Panels() {
  const state = useGame();
  switch (state.ui.panel) {
    case 'inventory':
      return <InventoryPanel />;
    case 'map':
      return <MapPanel />;
    case 'nav':
      return <NavPanel />;
    case 'greenhouse':
      return <GreenhousePanel />;
    case 'build':
      return <BuildPanel />;
    case 'pause':
      return <PausePanel />;
    case 'settings':
      return <SettingsPanel />;
    case 'log':
      return <LogPanel />;
    case 'seeds':
      return <SeedPanel />;
    default:
      return null;
  }
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-space-950">
      <div className="text-center">
        <div className="relative mx-auto mb-5 h-14 w-14">
          <span className="absolute inset-0 animate-spin-slow rounded-full border-2 border-dashed border-nav-400/50" />
          <span className="absolute inset-3 rounded-full bg-mars-500/70 blur-[2px]" />
        </div>
        <p className="label text-nav-300">Generating Martian surface</p>
        <p className="mt-2 font-mono text-[11px] text-slate-500">
          terrain · sprites · atmosphere · audio
        </p>
      </div>
    </div>
  );
}

function BlackoutOverlay() {
  const state = useGame();
  if (!state.ui.blackout) return null;
  return (
    <div className="absolute inset-0 z-[60] grid place-items-center bg-black/95 anim-fade">
      <div className="text-center">
        <Icon name="warning" className="mx-auto mb-3 h-8 w-8 animate-blink text-alert-500" />
        <p className="font-display text-lg uppercase tracking-[0.3em] text-alert-500">
          Oxygen depleted
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Emergency hibernation engaged · suit beacon guiding you to the shelter
        </p>
      </div>
    </div>
  );
}

export function GameScreen() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const off = bus.on('game:ready', () => setReady(true));
    createGame(el);
    return () => {
      off();
      destroyGame();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;
      const panel = getState().ui.panel;

      switch (e.key.toLowerCase()) {
        case 'e':
          if (panel === 'none') bus.emit('ui:interact');
          break;
        case 'i':
          e.preventDefault();
          sfx('ui_open');
          togglePanel('inventory');
          break;
        case 'm':
          e.preventDefault();
          sfx('ui_open');
          togglePanel('map');
          break;
        case 'n':
          e.preventDefault();
          sfx('ui_open');
          togglePanel('nav');
          break;
        case 'l':
          e.preventDefault();
          sfx('ui_open');
          togglePanel('log');
          break;
        case 'escape':
          e.preventDefault();
          if (panel !== 'none') {
            sfx('ui_close');
            closePanel();
          } else {
            sfx('ui_open');
            openPanel('pause');
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-space-950">
      <div ref={mountRef} className="absolute inset-0" />
      {ready && <HUD />}
      <Panels />
      <BlackoutOverlay />
      {!ready && <LoadingOverlay />}
    </div>
  );
}
