import { useState } from 'react';
import { PanelShell } from '../components/PanelShell';
import { Icon, ITEM_ICONS } from '../components/Icon';
import { BUILD_REQUIREMENTS, BUILD_SITES, TRANSMITTER_REQUIREMENTS } from '../../game/constants';
import { ITEMS } from '../../state/items';
import { buildGreenhouse, canBuildGreenhouse, repairTransmitter, selectBuildSite } from '../../state/gameplay';
import { closePanel, hasItem, useGame } from '../../state/store';
import { transient } from '../../state/transient';
import { sfx } from '../../audio/AudioEngine';

function Checklist({ items }: { items: { id: string; label: string; have: boolean }[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item.id}
          className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${
            item.have ? 'border-bio-400/30 bg-bio-600/10' : 'border-white/10 bg-black/20'
          }`}
        >
          <span
            className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${
              item.have ? 'border-bio-400/40 text-bio-400' : 'border-white/15 text-slate-600'
            }`}
          >
            <Icon
              name={item.have ? 'check' : (ITEM_ICONS[item.id] ?? 'box')}
              className="h-3.5 w-3.5"
              strokeWidth={2}
            />
          </span>
          <span className={`text-[12.5px] ${item.have ? 'text-slate-200' : 'text-slate-500'}`}>
            {item.label}
          </span>
          <span className="ml-auto readout text-[10px] text-slate-500">
            {item.have ? 'STOWED' : 'MISSING'}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Wire-frame preview of the module that will be raised. */
function GreenhousePreview({ ready }: { ready: boolean }) {
  const stroke = ready ? 'rgba(118,220,146,0.9)' : 'rgba(56,220,248,0.55)';
  return (
    <svg viewBox="0 0 220 130" className="w-full">
      <defs>
        <linearGradient id="ghfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ready ? 'rgba(118,220,146,0.22)' : 'rgba(56,220,248,0.14)'} />
          <stop offset="1" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="112" rx="92" ry="12" fill="none" stroke={stroke} strokeDasharray="7 6" />
      <path d="M26 112 A84 80 0 0 1 194 112 Z" fill="url(#ghfill)" stroke={stroke} strokeWidth="1.6" />
      {[0.2, 0.4, 0.6, 0.8].map((t) => (
        <path
          key={t}
          d={`M${26 + 168 * t} 112 A${84 * Math.abs(0.5 - t) * 2 + 4} 80 0 0 1 ${26 + 168 * t} 112`}
          fill="none"
          stroke={stroke}
          strokeWidth="0.9"
          opacity="0.6"
        />
      ))}
      {[0.35, 0.6, 0.85].map((t) => (
        <ellipse key={t} cx="110" cy="112" rx="84" ry={80 * t} fill="none" stroke={stroke} strokeWidth="0.8" opacity="0.45" />
      ))}
      <rect x="92" y="78" width="36" height="34" rx="6" fill="rgba(0,0,0,0.4)" stroke={stroke} strokeWidth="1.4" />
      <rect x="18" y="80" width="18" height="32" rx="4" fill="rgba(0,0,0,0.3)" stroke={stroke} strokeWidth="1" />
      <rect x="186" y="74" width="26" height="16" rx="3" fill="rgba(0,0,0,0.3)" stroke={stroke} strokeWidth="1" />
    </svg>
  );
}

function Construction() {
  const state = useGame();
  const [site, setSite] = useState<string | null>(
    state.greenhouse.siteId ?? transient.surveyedSite ?? null,
  );
  const ready = canBuildGreenhouse(state);
  const chosen = state.greenhouse.siteId;

  return (
    <PanelShell
      title="Greenhouse construction"
      subtitle={
        chosen
          ? 'Site confirmed — assemble when every component is recovered'
          : 'Survey the flats and choose where your food will live'
      }
      icon="frame"
      accent="bio"
      size="lg"
      onClose={closePanel}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            {ready
              ? 'All components recovered. The structure can be raised.'
              : `${BUILD_REQUIREMENTS.filter((r) => hasItem(r.id, state)).length}/${BUILD_REQUIREMENTS.length} components recovered.`}
          </p>
          <div className="flex gap-2">
            {!chosen && (
              <button
                className="btn btn-primary py-2 text-[11px]"
                disabled={!site}
                onClick={() => {
                  if (site) selectBuildSite(site);
                }}
              >
                Confirm site
              </button>
            )}
            <button
              className="btn btn-bio py-2 text-[11px]"
              disabled={!ready || !chosen}
              onClick={() => {
                sfx('ui_click');
                buildGreenhouse();
              }}
            >
              Raise the greenhouse
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
        <div>
          <p className="label mb-2">Construction site</p>
          <div className="space-y-2">
            {BUILD_SITES.map((option) => {
              const active = (chosen ?? site) === option.id;
              return (
                <button
                  key={option.id}
                  disabled={!!chosen && chosen !== option.id}
                  onClick={() => {
                    sfx('ui_hover');
                    setSite(option.id);
                  }}
                  className={`w-full rounded-lg border p-3 text-left transition disabled:opacity-30 ${
                    active
                      ? 'border-bio-400/60 bg-bio-600/10'
                      : 'border-white/10 bg-black/20 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-display text-[12px] uppercase tracking-[0.12em] text-slate-100">
                      {option.name}
                    </p>
                    {active && <Icon name="check" className="h-4 w-4 text-bio-400" strokeWidth={2.4} />}
                  </div>
                  <p className="mt-1 text-[11.5px] leading-snug text-slate-400">{option.note}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="label mb-2">Structure preview</p>
            <GreenhousePreview ready={ready} />
            <p className="mt-1 text-center text-[10px] text-slate-500">
              Inflatable pressure dome · 0.98 bar · 4 growing bays
            </p>
          </div>
        </div>

        <div>
          <p className="label mb-2">Required components</p>
          <Checklist
            items={BUILD_REQUIREMENTS.map((r) => ({
              id: r.id,
              label: ITEMS[r.id].name,
              have: hasItem(r.id, state),
            }))}
          />
          <div className="mt-4 rounded-lg border border-nav-400/20 bg-nav-500/5 p-3">
            <p className="label mb-1 flex items-center gap-1.5 text-[9px]">
              <Icon name="science" className="h-3 w-3" />
              Why a sealed module?
            </p>
            <p className="text-[11.5px] leading-relaxed text-nav-200/80">
              Surface pressure on Mars averages about 6 millibars — under 1% of Earth&apos;s. Liquid
              water boils away and crops cannot transpire, so anything we grow has to live inside a
              pressurised volume with its own air, heat and light.
            </p>
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

function Transmitter() {
  const state = useGame();
  const ready = TRANSMITTER_REQUIREMENTS.every((r) => hasItem(r.id, state));

  return (
    <PanelShell
      title="Emergency transmitter"
      subtitle="Mast MX-2 · high-gain uplink to the Deep Space Network"
      icon="radio"
      accent="mars"
      size="md"
      onClose={closePanel}
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            {ready ? 'All parts present. Ready to broadcast.' : 'Recover the missing parts first.'}
          </p>
          <button
            className="btn btn-mars btn-sheen py-2 text-[11px]"
            disabled={!ready}
            onClick={() => {
              sfx('ui_click');
              repairTransmitter();
            }}
          >
            Repair &amp; transmit
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <Checklist
          items={TRANSMITTER_REQUIREMENTS.map((r) => ({
            id: r.id,
            label: ITEMS[r.id].name,
            have: hasItem(r.id, state),
          }))}
        />
        <div className="rounded-lg border border-nav-400/20 bg-nav-500/5 p-3">
          <p className="label mb-1 flex items-center gap-1.5 text-[9px]">
            <Icon name="science" className="h-3 w-3" />
            Speaking across 200 million kilometres
          </p>
          <p className="text-[11.5px] leading-relaxed text-nav-200/80">
            A signal from Mars reaches Earth in 5 to 20 minutes depending on where the two planets
            are in their orbits. There is no conversation — only messages sent, and messages
            waited for.
          </p>
        </div>
      </div>
    </PanelShell>
  );
}

export function BuildPanel() {
  const state = useGame();
  return state.greenhouse.built ? <Transmitter /> : <Construction />;
}
