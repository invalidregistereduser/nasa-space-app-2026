import { useState } from 'react';
import { PanelShell } from '../components/PanelShell';
import { Icon } from '../components/Icon';
import { MISSIONS } from '../../state/missions';
import { closePanel, useGame } from '../../state/store';
import { useLive } from '../../state/live';
import { sfx } from '../../audio/AudioEngine';

type Tab = 'objectives' | 'science';

export function NavPanel() {
  const state = useGame();
  const live = useLive(3);
  const [tab, setTab] = useState<Tab>('objectives');
  const mission = MISSIONS[state.missionIndex];

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'objectives', label: 'Objectives', icon: 'flag' },
    { id: 'science', label: 'Science log', icon: 'science' },
  ];

  return (
    <PanelShell
      title="ARES NAV"
      subtitle="Survival guidance system · suit-integrated"
      icon="nav"
      size="md"
      onClose={closePanel}
      footer={
        <p className="text-[11px] text-slate-500">
          ARES NAV guides — it does not drive. Where you go and what you build is your call.
        </p>
      }
    >
      <div className="mb-4 flex gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              sfx('ui_hover');
              setTab(t.id);
            }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-display text-[10px] uppercase tracking-[0.16em] transition ${
              tab === t.id
                ? 'border-nav-400/50 bg-nav-500/15 text-nav-200'
                : 'border-white/10 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon name={t.icon} className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'objectives' && (
        <div className="space-y-4">
          {mission ? (
            <div className="panel panel-tight border-nav-400/30 p-4">
              <p className="label text-mars-300">{mission.code} · Current</p>
              <p className="mt-1 font-display text-[15px] uppercase tracking-[0.12em] text-white">
                {mission.title}
              </p>
              <p className="mt-2 text-[13px] text-slate-300">
                {mission.objectiveOf ? mission.objectiveOf(state) : mission.objective}
              </p>
              {state.settings.showHints && (
                <p className="mt-3 flex gap-2 rounded-lg border border-white/10 bg-black/30 p-2.5 text-[11.5px] leading-relaxed text-slate-400">
                  <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-nav-300" />
                  {mission.hint}
                </p>
              )}
              {live.waypoint && (
                <p className="mt-3 flex items-center gap-2 text-[11px] text-nav-200">
                  <Icon name="compass" className="h-3.5 w-3.5" />
                  Waypoint: {live.waypoint.label} · {live.waypoint.distance} m
                </p>
              )}
            </div>
          ) : (
            <div className="panel panel-tight border-bio-400/30 p-4">
              <p className="label text-bio-400">All objectives complete</p>
              <p className="mt-2 text-[13px] text-slate-300">
                The signal is away, {state.playerName}. Keep exploring — the surface is yours.
              </p>
            </div>
          )}

          <div>
            <p className="label mb-2">Mission log</p>
            <ol className="space-y-1.5">
              {MISSIONS.filter((_, i) => i <= state.missionIndex + 1).map((m, i) => {
                const done = i < state.missionIndex;
                const current = i === state.missionIndex;
                const locked = i > state.missionIndex;
                return (
                  <li
                    key={m.id}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${
                      current
                        ? 'border-nav-400/40 bg-nav-500/10'
                        : done
                          ? 'border-bio-400/20 bg-bio-600/5'
                          : 'border-white/5 bg-black/20'
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[9px] ${
                        done
                          ? 'border-bio-400/50 text-bio-400'
                          : current
                            ? 'border-nav-400/60 text-nav-200'
                            : 'border-white/15 text-slate-600'
                      }`}
                    >
                      {done ? <Icon name="check" className="h-3 w-3" strokeWidth={2.6} /> : i + 1}
                    </span>
                    <span
                      className={`truncate text-[12px] ${
                        locked ? 'text-slate-600' : done ? 'text-slate-400' : 'text-slate-100'
                      }`}
                    >
                      {locked ? '— not yet —' : m.title}
                    </span>
                  </li>
                );
              })}
            </ol>
            {state.missionIndex + 2 < MISSIONS.length && (
              <p className="mt-2 text-center text-[11px] text-slate-600">
                +{MISSIONS.length - state.missionIndex - 2} more to come
              </p>
            )}
          </div>
        </div>
      )}

      {tab === 'science' && (
        <div className="space-y-2.5">
          <p className="text-[11.5px] text-slate-400">
            What you have learned so far — {state.codex.length}{' '}
          {state.codex.length === 1 ? 'entry' : 'entries'}.
          </p>
          {state.codex.length === 0 && (
            <div className="grid place-items-center rounded-lg border border-white/10 bg-black/20 py-10 text-center">
              <Icon name="science" className="mb-2 h-8 w-8 text-slate-700" />
              <p className="text-xs text-slate-500">
                Recover equipment and complete objectives to fill the science log.
              </p>
            </div>
          )}
          {[...state.codex].reverse().map((entry) => (
            <div key={entry.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-[12px] uppercase tracking-[0.12em] text-nav-200">
                  {entry.title}
                </p>
                <span className="readout shrink-0 text-[10px] text-slate-600">SOL {entry.sol}</span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-slate-300">{entry.body}</p>
            </div>
          ))}
        </div>
      )}

    </PanelShell>
  );
}
