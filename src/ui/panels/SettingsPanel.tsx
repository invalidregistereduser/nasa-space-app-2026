import type { CharacterId, TextSpeed } from '../../types';
import { PanelShell } from '../components/PanelShell';
import { Icon } from '../components/Icon';
import { CharacterPreview } from '../canvas/CharacterPreview';
import { audio, sfx } from '../../audio/AudioEngine';
import { closePanel, setCharacter, setSettings, useGame } from '../../state/store';
import { deleteSave, hasSave, saveSettings } from '../../state/save';
import { getGame } from '../../game/PhaserGame';

function Slider({
  label,
  value,
  min = 0,
  max = 100,
  suffix = '%',
  onChange,
  icon,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  suffix?: string;
  onChange: (v: number) => void;
  icon: string;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center justify-between text-[12px] text-slate-300">
        <span className="flex items-center gap-2">
          <Icon name={icon} className="h-3.5 w-3.5 text-nav-300" />
          {label}
        </span>
        <span className="readout text-[11px] text-slate-400">
          {Math.round(value)}
          {suffix}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-left transition hover:border-white/25 focus-visible:border-nav-300 focus-visible:outline-none"
      onClick={() => {
        sfx('ui_click');
        onChange(!checked);
      }}
      aria-pressed={checked}
    >
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          checked ? 'bg-nav-500/60' : 'bg-white/10'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            checked ? 'left-[1.15rem]' : 'left-0.5'
          }`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-[12.5px] text-slate-100">{label}</span>
        <span className="block text-[11px] text-slate-500">{description}</span>
      </span>
    </button>
  );
}

const SPEEDS: { id: TextSpeed; label: string }[] = [
  { id: 'relaxed', label: 'Relaxed' },
  { id: 'normal', label: 'Normal' },
  { id: 'fast', label: 'Fast' },
];

export function SettingsPanel() {
  const state = useGame();
  const s = state.settings;
  const inGame = state.phase === 'playing';

  const update = (patch: Partial<typeof s>) => {
    const next = { ...s, ...patch };
    setSettings(patch);
    saveSettings(next);
    audio.setMix({ master: next.master, music: next.music, sfx: next.sfx });
  };

  const switchCharacter = (id: CharacterId) => {
    if (id === state.character) return;
    sfx('ui_click');
    setCharacter(id);
    if (inGame) getGame()?.scene.getScene('World')?.scene.restart();
  };

  return (
    <PanelShell
      title="Settings"
      subtitle="Audio, readability, comfort and crew"
      icon="gear"
      size="lg"
      onClose={closePanel}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-3">
          <p className="label">Audio</p>
          <Slider
            label="Master"
            icon="radio"
            value={s.master * 100}
            onChange={(v) => update({ master: v / 100 })}
          />
          <Slider
            label="Music & ambience"
            icon="nav"
            value={s.music * 100}
            onChange={(v) => update({ music: v / 100 })}
          />
          <Slider
            label="Effects"
            icon="power"
            value={s.sfx * 100}
            onChange={(v) => update({ sfx: v / 100 })}
          />
          <button
            className="btn w-full py-2 text-[11px]"
            onClick={() => update({ master: s.master > 0 ? 0 : 0.75 })}
          >
            {s.master > 0 ? 'Mute everything' : 'Unmute'}
          </button>
        </section>

        <section className="space-y-3">
          <p className="label">Display &amp; comfort</p>
          <Slider
            label="Interface scale"
            icon="grid"
            min={85}
            max={125}
            value={s.uiScale * 100}
            onChange={(v) => update({ uiScale: v / 100 })}
          />
          <Toggle
            label="Reduce motion"
            description="Calms shakes, zooms and decorative animation"
            checked={s.reduceMotion}
            onChange={(v) => update({ reduceMotion: v, screenShake: v ? false : s.screenShake })}
          />
          <Toggle
            label="Screen shake"
            description="Camera shake during impacts and construction"
            checked={s.screenShake}
            onChange={(v) => update({ screenShake: v })}
          />
          <div>
            <p className="mb-1.5 flex items-center gap-2 text-[12px] text-slate-300">
              <Icon name="info" className="h-3.5 w-3.5 text-nav-300" />
              Text speed
            </p>
            <div className="flex gap-1.5">
              {SPEEDS.map((speed) => (
                <button
                  key={speed.id}
                  onClick={() => update({ textSpeed: speed.id })}
                  className={`flex-1 rounded-md border px-2 py-1.5 font-display text-[10px] uppercase tracking-[0.14em] transition ${
                    s.textSpeed === speed.id
                      ? 'border-nav-400/60 bg-nav-500/15 text-nav-200'
                      : 'border-white/10 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {speed.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <p className="label">Guidance &amp; accessibility</p>
          <Toggle
            label="Waypoint arrow"
            description="Edge arrow pointing at the current objective"
            checked={s.showWaypointArrow}
            onChange={(v) => update({ showWaypointArrow: v })}
          />
          <Toggle
            label="Objective hints"
            description="ARES NAV explains how to finish each task"
            checked={s.showHints}
            onChange={(v) => update({ showHints: v })}
          />
          <Toggle
            label="Colourblind gauges"
            description="Blue-yellow palette for the life-support bars"
            checked={s.colorblind}
            onChange={(v) => update({ colorblind: v })}
          />
        </section>
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <p className="label mb-3">Astronaut</p>
        <div className="flex flex-wrap gap-3">
          {(['male', 'female'] as CharacterId[]).map((id) => (
            <button
              key={id}
              onClick={() => switchCharacter(id)}
              className={`flex flex-1 items-center gap-3 rounded-lg border p-3 text-left transition ${
                state.character === id
                  ? 'border-nav-400/60 bg-nav-500/10'
                  : 'border-white/10 bg-black/20 hover:border-white/25'
              }`}
            >
              <CharacterPreview kind={id} scale={1.1} animated={false} />
              <span>
                <span className="block font-display text-[12px] uppercase tracking-[0.12em] text-slate-100">
                  {id === 'male' ? 'Suit A · flight engineer' : 'Suit B · mission botanist'}
                </span>
                <span className="block text-[11px] text-slate-500">
                  {state.character === id ? 'Active' : 'Switch to this suit'}
                </span>
              </span>
            </button>
          ))}
        </div>
        {inGame && (
          <p className="mt-2 text-[11px] text-slate-500">
            Switching suits reloads the surface — your progress is kept.
          </p>
        )}
      </div>

      {hasSave() && (
        <div className="mt-5 border-t border-white/10 pt-5">
          <button
            className="btn w-full border-alert-600/40 py-2 text-[11px] text-alert-500 hover:border-alert-500"
            onClick={() => {
              sfx('warn');
              deleteSave();
              closePanel();
            }}
          >
            Delete saved mission
          </button>
        </div>
      )}
    </PanelShell>
  );
}
