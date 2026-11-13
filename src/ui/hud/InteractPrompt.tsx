import { Icon } from '../components/Icon';
import { useGame } from '../../state/store';

/**
 * The contextual action prompt. Soft fade-in when something comes in range,
 * with a key cap that bobs gently while the action is available.
 */
export function InteractPrompt() {
  const state = useGame();
  const prompt = state.ui.prompt;
  if (!prompt || state.ui.panel !== 'none' || state.ui.dialogue.length > 2) return null;

  return (
    <div key={prompt.id} className="pointer-events-none anim-rise">
      <div
        className={`glass-panel flex items-center gap-3 rounded-2xl px-4 py-2.5 ${
          prompt.enabled ? '' : 'opacity-75'
        }`}
      >
        <kbd
          className={`keycap h-8 min-w-8 text-[12px] ${
            prompt.enabled ? '' : 'keycap-quiet'
          }`}
          style={prompt.enabled ? { animation: 'key-bob 1.9s ease-in-out infinite' } : undefined}
        >
          E
        </kbd>
        <div className="min-w-0">
          <p
            className={`truncate text-[13.5px] leading-tight ${
              prompt.enabled ? 'text-slate-50' : 'text-slate-400'
            }`}
          >
            {prompt.label}
          </p>
          {prompt.detail && (
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-slate-400">
              {!prompt.enabled && <Icon name="lock" className="h-3 w-3 shrink-0" />}
              {prompt.detail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
