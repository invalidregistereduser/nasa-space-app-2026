import { Vitals, VitalsCompact } from './Vitals';
import { ObjectiveCard } from './ObjectiveCard';
import { AresDialogue } from './AresDialogue';
import { InteractPrompt } from './InteractPrompt';
import { Toasts } from './Toasts';
import { TouchControls } from './TouchControls';
import { TutorialHints } from './TutorialHints';
import { MissionTick } from './MissionTick';
import { CollectFx } from './CollectFx';
import { SaveIndicator } from './SaveIndicator';
import { Minimap } from './Minimap';
import { WaypointArrow } from './WaypointArrow';
import { ThoughtBubble } from './ThoughtBubble';
import { BedCard } from './BedCard';
import { MenuButton } from './MenuButton';
import { useCoarsePointer } from './useCoarsePointer';
import { useLive } from '../../state/live';
import { useGame } from '../../state/store';

export function HUD() {
  const state = useGame();
  const liveData = useLive(4);
  const touch = useCoarsePointer();
  const hidden = state.ui.panel !== 'none';
  const scale = { zoom: state.settings.uiScale } as React.CSSProperties;
  const indoors = liveData.indoors;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-200 ${
        hidden ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {!indoors && <WaypointArrow />}
      <CollectFx />
      <MissionTick />
      <ThoughtBubble />
      <BedCard />

      {/* One menu, top left. Everything else lives behind it. */}
      <div className="absolute left-4 top-4 flex flex-col items-start gap-2 sm:left-6 sm:top-6" style={scale}>
        <MenuButton />
        <SaveIndicator />
      </div>

      <div className="absolute right-4 top-4 hidden sm:block sm:right-6 sm:top-6" style={scale}>
        <ObjectiveCard />
      </div>

      {/* Phones: mission pill and vitals tucked under the menu button. */}
      <div className="absolute right-3 top-3 flex flex-col items-end gap-2 sm:hidden" style={scale}>
        <ObjectiveCard />
        <VitalsCompact />
      </div>

      <div className="absolute left-1/2 top-28 -translate-x-1/2 sm:top-6" style={scale}>
        <Toasts />
      </div>

      <div className="absolute bottom-4 left-4 hidden sm:block sm:bottom-6 sm:left-6" style={scale}>
        <Vitals />
      </div>

      {/* Bottom right is the map, and only the map. */}
      {!indoors && (
        <div className="absolute bottom-4 right-4 hidden sm:block sm:bottom-6 sm:right-6" style={scale}>
          <Minimap />
        </div>
      )}

      <div
        className="absolute bottom-[13.5rem] left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 sm:bottom-28"
        style={scale}
      >
        <AresDialogue />
        <InteractPrompt />
      </div>

      {!touch && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 sm:bottom-7" style={scale}>
          <TutorialHints />
        </div>
      )}

      <TouchControls />
    </div>
  );
}
