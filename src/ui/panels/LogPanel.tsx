import { PanelShell } from '../components/PanelShell';
import { Icon } from '../components/Icon';
import { closePanel, useGame } from '../../state/store';
import { fmt } from '../../util/text';

/**
 * Everything ARES NAV has said so far, in case a line went by too fast, and
 * the stored messages from home, which only ever show up here.
 */
export function LogPanel() {
  const state = useGame();
  const entries = [...state.dialogueLog].reverse();

  return (
    <PanelShell
      title="Radio log"
      subtitle={`${state.dialogueLog.length} ${state.dialogueLog.length === 1 ? 'entry' : 'entries'}`}
      icon="radio"
      size="md"
      onClose={closePanel}
    >
      {entries.length === 0 ? (
        <div className="grid place-items-center py-14 text-center">
          <Icon name="radio" className="mb-3 h-9 w-9 text-slate-700" />
          <p className="text-sm text-slate-400">Nothing logged yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="label text-[9px] text-nav-300">{entry.speaker}</p>
                <span className="readout text-[10px] text-slate-600">SOL {entry.sol}</span>
              </div>
              {entry.lines.map((line, i) => (
                <p key={i} className="mt-1 text-[12.5px] leading-relaxed text-slate-300">
                  {fmt(line, state.playerName)}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </PanelShell>
  );
}
