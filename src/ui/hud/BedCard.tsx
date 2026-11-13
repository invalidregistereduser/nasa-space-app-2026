import { Icon, ITEM_ICONS } from '../components/Icon';
import { bedForecast } from '../../state/gameplay';
import { useGame } from '../../state/store';
import { live, useLive } from '../../state/live';

function formatWait(seconds: number) {
  if (!Number.isFinite(seconds)) return 'stalled';
  if (seconds < 60) return `~${Math.max(1, Math.round(seconds))}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `~${m}m ${String(s).padStart(2, '0')}s`;
}

/** Floating readout for whichever bed the pointer is resting on. */
export function BedCard() {
  const state = useGame();
  useLive(10);
  const index = live.hoverBed;
  if (index === null || !live.indoors || state.ui.panel !== 'none') return null;

  const slot = state.greenhouse.slots[index];
  if (!slot) return null;
  const forecast = bedForecast(index);
  const x = Math.min(Math.max(live.hoverX + 18, 20), window.innerWidth - 250);
  const y = Math.min(Math.max(live.hoverY - 20, 20), window.innerHeight - 190);

  return (
    <div
      className="pointer-events-none absolute z-30 w-[14rem] anim-fade"
      style={{ left: x, top: y }}
    >
      <div className="glass-panel rounded-xl p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="label text-[9px] text-slate-400">Bed {index + 1}</p>
          {slot.fertilised && (
            <span className="rounded bg-bio-600/25 px-1.5 py-0.5 text-[8.5px] uppercase tracking-wider text-bio-300">
              composted
            </span>
          )}
        </div>

        {!slot.crop || !forecast ? (
          <>
            <p className="mt-1 font-display text-[13px] uppercase tracking-[0.1em] text-white">
              Empty bed
            </p>
            <p className="mt-1.5 text-[11.5px] leading-snug text-slate-400">
              {state.greenhouse.containersReady
                ? 'Take a seed tin from the shelf, then press E here.'
                : 'The medium still needs rinsing and dosing.'}
            </p>
          </>
        ) : (
          <>
            <div className="mt-1 flex items-center gap-2">
              <Icon
                name={ITEM_ICONS[slot.crop] ?? 'plant'}
                className="h-4 w-4"
                strokeWidth={1.7}
              />
              <p className="font-display text-[13px] uppercase tracking-[0.1em] text-white">
                {forecast.def.name}
              </p>
            </div>

            <div className="mt-2.5 space-y-1.5">
              <Row label="Growth" value={`${Math.floor(slot.growth)}%`}>
                <div className="bar h-1.5">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${slot.growth}%`,
                      background: 'linear-gradient(90deg,#2f8f4e,#76dc92)',
                    }}
                  />
                </div>
              </Row>
              <Row label="Water" value={`${Math.round(slot.water)}%`}>
                <div className="bar h-1.5">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${slot.water}%`,
                      background:
                        slot.water < 30
                          ? 'linear-gradient(90deg,#f5a524,#ff7a45)'
                          : 'linear-gradient(90deg,#2f8ed6,#8fd8ff)',
                    }}
                  />
                </div>
              </Row>
            </div>

            <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2 text-[11px]">
              <span
                className={
                  forecast.status === 'Thriving' || forecast.status === 'Ready to pick'
                    ? 'text-bio-400'
                    : 'text-warn-400'
                }
              >
                {forecast.status}
              </span>
              <span className="readout text-slate-400">
                {slot.ready ? 'done' : formatWait(forecast.secondsLeft)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="label text-[8.5px] text-slate-500">{label}</span>
        <span className="readout text-[10px] text-slate-300">{value}</span>
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
