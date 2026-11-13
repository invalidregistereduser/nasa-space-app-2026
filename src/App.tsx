import { useEffect, useRef, useState } from 'react';
import { TitleScreen } from './ui/screens/TitleScreen';
import { IntroScreen } from './ui/screens/IntroScreen';
import { NameScreen } from './ui/screens/NameScreen';
import { CharacterScreen } from './ui/screens/CharacterScreen';
import { CrashScreen } from './ui/screens/CrashScreen';
import { GameScreen } from './ui/screens/GameScreen';
import { EndingScreen } from './ui/screens/EndingScreen';
import { SettingsPanel } from './ui/panels/SettingsPanel';
import { audio } from './audio/AudioEngine';
import { loadSettings } from './state/save';
import { setSettings, useGame } from './state/store';

export default function App() {
  const state = useGame();

  // Restore saved audio/accessibility preferences once.
  useEffect(() => {
    const saved = loadSettings();
    if (saved) setSettings(saved);
    const mix = { ...state.settings, ...(saved ?? {}) };
    audio.setMix({ master: mix.master, music: mix.music, sfx: mix.sfx });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Browsers only allow audio after a gesture.
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const screen = () => {
    switch (state.phase) {
      case 'intro':
        return <IntroScreen />;
      case 'name':
        return <NameScreen />;
      case 'character':
        return <CharacterScreen />;
      case 'crash':
        return <CrashScreen />;
      case 'playing':
        return <GameScreen />;
      case 'ending':
        return <EndingScreen />;
      case 'title':
      default:
        return <TitleScreen />;
    }
  };

  return (
    <div className="relative h-full w-full">
      <div key={state.phase} className="anim-screen h-full w-full">
        {screen()}
      </div>
      <PhaseFade phase={state.phase} />
      {state.phase !== 'playing' && state.ui.panel === 'settings' && <SettingsPanel />}
    </div>
  );
}

/** Soft wipe between screens so nothing ever hard-cuts. */
function PhaseFade({ phase }: { phase: string }) {
  const [visible, setVisible] = useState(false);
  const previous = useRef(phase);

  useEffect(() => {
    if (previous.current === phase) return;
    previous.current = phase;
    setVisible(true);
    const id = window.setTimeout(() => setVisible(false), 40);
    return () => window.clearTimeout(id);
  }, [phase]);

  const warm = phase === 'playing' || phase === 'crash';
  return (
    <div
      className="pointer-events-none absolute inset-0 z-50 transition-opacity duration-500"
      style={{
        opacity: visible ? 1 : 0,
        background: warm
          ? 'radial-gradient(circle at 50% 55%, #c98a5e 0%, #4a1f10 60%, #120805 100%)'
          : '#03050d',
      }}
    />
  );
}
