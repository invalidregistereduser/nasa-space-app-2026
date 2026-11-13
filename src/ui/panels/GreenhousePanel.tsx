import { PanelShell } from '../components/PanelShell';
import { Icon } from '../components/Icon';
import { CROPS } from '../../state/items';
import { closePanel, useGame } from '../../state/store';
import {
  ghActivatePower,
  ghConnectWater,
  ghPrepareTrays,
  ghSetLight,
  ghSetTemperature,
  ghToggleRow,
  ghTogglePower,
} from '../../state/gameplay';
import { sfx } from '../../audio/AudioEngine';
import { daylight, surfaceTemp } from '../../util/time';

function SystemRow({
  label,
  description,
  done,
  disabled,
  actionLabel,
  onAction,
  icon,
}: {
  label: string;
  description: string;
  done: boolean;
  disabled?: boolean;
  actionLabel: string;
  onAction: () => void;
  icon: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
        done ? 'border-bio-400/30 bg-bio-600/10' : 'border-white/10 bg-black/20'
      }`}
    >
      <div
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${
          done ? 'border-bio-400/40 text-bio-400' : 'border-white/10 text-slate-400'
        }`}
      >
        <Icon name={done ? 'check' : icon} className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-slate-100">{label}</p>
        <p className="truncate text-[11px] text-slate-400">{description}</p>
      </div>
      <button
        className={`btn-chip shrink-0 ${done ? 'btn-chip-quiet' : 'btn-chip-active'}`}
        disabled={disabled}
        onClick={() => {
          sfx('ui_click');
          onAction();
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

/**
 * The console on the greenhouse workbench: climate, power and a glance at every
 * bed. The planting itself happens out on the floor of the interior.
 */
export function GreenhousePanel() {
  const state = useGame();
  const gh = state.greenhouse;
  const sun = daylight(state.solTime);
  const systemsReady = gh.power && gh.waterConnected && gh.containersReady;

  return (
    <PanelShell
      title="Greenhouse systems"
      subtitle={
        systemsReady
          ? 'Everything is running. The beds are yours.'
          : 'Bring the module online before anything can grow'
      }
      icon="plant"
      accent="bio"
      size="lg"
      onClose={closePanel}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-2">
            <Icon name="science" className="h-3.5 w-3.5 shrink-0 text-nav-300" />
            Plants give back nearly all the water they are poured — the condenser catches it, so a
            sealed greenhouse sips where a field would gulp.
          </span>
          <span className="readout shrink-0">Harvests: {gh.harvests}</span>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-2.5">
          <p className="label">Startup sequence</p>
          <SystemRow
            icon="power"
            label="Solar power"
            description={
              gh.power
                ? `Online · battery ${Math.round(gh.charge)}%`
                : `Offline · battery ${Math.round(gh.charge)}%`
            }
            done={gh.power}
            actionLabel={gh.power ? 'Shut down' : 'Switch on'}
            onAction={gh.power ? ghTogglePower : ghActivatePower}
          />
          <SystemRow
            icon="water"
            label="Water recycler"
            description={gh.waterConnected ? 'Closed loop · 70% recovered' : 'Tank not connected yet'}
            done={gh.waterConnected}
            actionLabel={gh.waterConnected ? 'Connected' : 'Connect'}
            disabled={gh.waterConnected}
            onAction={ghConnectWater}
          />
          <SystemRow
            icon="tray"
            label="Growing beds"
            description={
              gh.containersReady ? 'Regolith rinsed and dosed' : 'Raw regolith — perchlorates present'
            }
            done={gh.containersReady}
            actionLabel={gh.containersReady ? 'Ready' : 'Prepare'}
            disabled={gh.containersReady}
            onAction={ghPrepareTrays}
          />

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Icon name="battery" className="h-3.5 w-3.5 text-nav-300" />
                Battery
              </span>
              <span className="readout text-slate-300">{Math.round(gh.charge)}%</span>
            </div>
            <div className="bar mt-1.5">
              <div
                className="bar-fill"
                style={{
                  width: `${gh.charge}%`,
                  background:
                    gh.charge < 20
                      ? 'linear-gradient(90deg,#ff5a3c,#f5a524)'
                      : 'linear-gradient(90deg,#f5a524,#ffd27a)',
                }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">
              Charging · sunlight at {Math.round(sun * 100)}% · outside {surfaceTemp(state.solTime)}°C
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <p className="label">Climate</p>
              <span className={`readout text-[10px] ${gh.power ? 'text-bio-400' : 'text-alert-500'}`}>
                {gh.power ? 'REGULATED' : 'NO POWER'}
              </span>
            </div>

            <label className="mb-1 flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5">
                <Icon name="thermometer" className="h-3.5 w-3.5 text-mars-300" />
                Temperature
              </span>
              <span className="readout">{gh.temperature}°C</span>
            </label>
            <input
              type="range"
              min={2}
              max={32}
              value={gh.temperature}
              onChange={(e) => ghSetTemperature(Number(e.target.value))}
              className="w-full"
            />
            <p className="mt-1 text-[10px] text-slate-500">Most of what you can plant likes 18-23°C.</p>

            <label className="mb-1 mt-4 flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5">
                <Icon name="lamp" className="h-3.5 w-3.5 text-warn-400" />
                Lamp brightness
              </span>
              <span className="readout">{gh.light}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={gh.light}
              onChange={(e) => ghSetLight(Number(e.target.value))}
              className="w-full"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Brighter lamps grow crops faster and drain the battery sooner.
            </p>

            <p className="label mb-1.5 mt-4 text-[9px]">Rows</p>
            <div className="flex gap-2">
              {gh.lightRows.map((on, row) => (
                <button
                  key={row}
                  className={`btn-chip flex-1 ${on ? 'btn-chip-active' : 'btn-chip-quiet'}`}
                  onClick={() => ghToggleRow(row)}
                >
                  Row {row + 1} · {on ? 'on' : 'off'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label mb-2">Beds at a glance</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {gh.slots.map((slot) => {
                const def = slot.crop ? CROPS[slot.crop] : null;
                const dry = slot.crop !== null && slot.water < 35;
                return (
                  <div
                    key={slot.index}
                    className={`rounded-lg border p-2.5 ${
                      slot.ready
                        ? 'border-bio-400/50 bg-bio-600/10'
                        : dry
                          ? 'border-warn-500/40 bg-black/20'
                          : 'border-white/10 bg-black/20'
                    }`}
                  >
                    <p className="label text-[8px] text-slate-500">Bed {slot.index + 1}</p>
                    <p className="mt-0.5 truncate text-[12px] text-slate-100">
                      {def ? def.name : 'Empty'}
                    </p>
                    {def && (
                      <>
                        <div className="bar mt-1.5 h-1">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${slot.growth}%`,
                              background: 'linear-gradient(90deg,#2f8f4e,#76dc92)',
                            }}
                          />
                        </div>
                        <p className="readout mt-1 text-[9.5px] text-slate-500">
                          {Math.floor(slot.growth)}% · water {Math.round(slot.water)}%
                          {slot.fertilised ? ' · composted' : ''}
                        </p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </PanelShell>
  );
}
