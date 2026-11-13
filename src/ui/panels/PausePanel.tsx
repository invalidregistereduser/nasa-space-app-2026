import { PanelShell } from '../components/PanelShell';
import { Icon } from '../components/Icon';
import { closePanel, openPanel, setPhase, useGame } from '../../state/store';
import { saveGame } from '../../state/save';
import { audio, sfx } from '../../audio/AudioEngine';
import { MISSIONS } from '../../state/missions';
import { destroyGame } from '../../game/PhaserGame';
import { resetLive } from '../../state/live';

const CONTROLS: [string, string][] = [
  ['W A S D / Arrows', 'Walk'],
  ['Shift', 'Move faster (uses more oxygen)'],
  ['E', 'Interact with the highlighted object'],
  ['I', 'Inventory'],
  ['M', 'Surface map'],
  ['N', 'ARES NAV guidance'],
  ['Space / Enter', 'Advance dialogue'],
  ['Esc', 'Pause menu'],
];

export function PausePanel() {
  const state = useGame();
  const mission = MISSIONS[state.missionIndex];

  const quit = () => {
    sfx('ui_close');
    saveGame();
    destroyGame();
    resetLive();
    audio.stopAmbient();
    setPhase('title');
    closePanel();
  };

  return (
    <PanelShell
      title="Mission paused"
      subtitle={`${state.playerName} · Sol ${state.sol} · ${mission?.title ?? 'All objectives complete'}`}
      icon="pause"
      size="md"
      onClose={closePanel}
    >
      <div className="grid gap-5 sm:grid-cols-[1fr_1.2fr]">
        <div className="space-y-2">
          <button className="btn btn-primary w-full py-2.5 text-[11px]" onClick={closePanel}>
            Resume mission
          </button>
          <button
            className="btn w-full py-2.5 text-[11px]"
            onClick={() => {
              sfx('ui_click');
              openPanel('settings');
            }}
          >
            Settings
          </button>
          <button
            className="btn w-full py-2.5 text-[11px]"
            onClick={() => {
              sfx('ui_click');
              openPanel('log');
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <Icon name="radio" className="h-3.5 w-3.5" />
              Dialogue log
            </span>
          </button>
          <button
            className="btn w-full py-2.5 text-[11px]"
            onClick={() => {
              sfx('ui_click');
              saveGame();
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <Icon name="save" className="h-3.5 w-3.5" />
              Save now
            </span>
          </button>
          <button className="btn w-full py-2.5 text-[11px]" onClick={quit}>
            Save &amp; return to title
          </button>
          <p className="pt-1 text-center text-[10.5px] text-slate-500">
            Progress also saves automatically.
          </p>
        </div>

        <div>
          <p className="label mb-2">Controls</p>
          <dl className="space-y-1">
            {CONTROLS.map(([key, action]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-md border border-white/5 bg-black/20 px-3 py-1.5"
              >
                <dt className="readout text-[11px] text-nav-200">{key}</dt>
                <dd className="text-[11.5px] text-slate-400">{action}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </PanelShell>
  );
}
