import { useCallback, useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { textSpeedMs, useTypewriter } from '../components/Typewriter';
import { advanceDialogue, useGame } from '../../state/store';
import { fmt } from '../../util/text';
import { sfx } from '../../audio/AudioEngine';

const TONE = {
  normal: {
    ring: 'border-nav-400/40',
    text: 'text-nav-300',
    bar: 'from-nav-500/70 to-transparent',
  },
  alert: {
    ring: 'border-alert-500/50',
    text: 'text-alert-500',
    bar: 'from-alert-500/70 to-transparent',
  },
  success: {
    ring: 'border-bio-400/50',
    text: 'text-bio-400',
    bar: 'from-bio-500/70 to-transparent',
  },
};

export function AresDialogue() {
  const state = useGame();
  const message = state.ui.dialogue[0];
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    setLineIndex(0);
  }, [message?.id]);

  const raw = message?.lines[lineIndex] ?? '';
  const line = fmt(raw, state.playerName);
  const tone = TONE[message?.tone ?? 'normal'];
  const typed = useTypewriter(line, { speed: textSpeedMs(), sound: true });

  const advance = useCallback(() => {
    if (!message) return;
    if (!typed.done) {
      typed.finish();
      return;
    }
    sfx('ui_click');
    if (lineIndex < message.lines.length - 1) setLineIndex((i) => i + 1);
    else advanceDialogue();
  }, [message, typed, lineIndex]);

  // Space / Enter advance, and lines auto-advance after a readable pause.
  useEffect(() => {
    if (!message) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /INPUT|TEXTAREA/.test(target.tagName)) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [message, advance]);

  const queued = state.ui.dialogue.length;
  useEffect(() => {
    if (!message || !typed.done) return;
    // No rushing when several are queued — they arrive one at a time regardless.
    const delay = 1800 + line.length * 26;
    const id = window.setTimeout(() => {
      if (lineIndex < message.lines.length - 1) setLineIndex((i) => i + 1);
      else advanceDialogue();
    }, delay);
    return () => window.clearTimeout(id);
  }, [message, typed.done, line.length, lineIndex, queued]);

  if (!message) return null;

  return (
    <div className="pointer-events-auto w-[min(34rem,calc(100vw-2rem))] anim-rise">
      <div
        className={`panel panel-glow scanlines relative cursor-pointer overflow-hidden px-4 py-3.5 ${tone.ring}`}
        onClick={advance}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') advance();
        }}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${tone.bar}`}
        />
        <div className="flex gap-3">
          <div className="relative shrink-0">
            <div
              className={`grid h-10 w-10 place-items-center rounded-lg border bg-black/40 ${tone.ring} ${tone.text}`}
            >
              <Icon name="nav" className="h-5 w-5" />
            </div>
            <span
              className={`absolute inset-0 animate-pulse-ring rounded-lg border ${tone.ring}`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className={`label text-[9px] ${tone.text}`}>
                {message.speaker} · Survival guidance
              </p>
              <span className="readout text-[9px] text-slate-600">
                {lineIndex + 1}/{message.lines.length}
              </span>
            </div>
            <p className="mt-1.5 min-h-[2.75rem] text-[13.5px] leading-relaxed text-slate-200">
              {typed.shown}
              {!typed.done && <span className="animate-caret text-nav-300">▌</span>}
            </p>

            {message.science && typed.done && lineIndex === message.lines.length - 1 && (
              <p className="mt-2 flex gap-2 border-t border-white/5 pt-2 text-[11px] leading-relaxed text-nav-200/70 anim-fade">
                <Icon name="science" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{message.science}</span>
              </p>
            )}

            <div className="mt-2 flex items-center justify-end">
              <button
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 transition hover:text-nav-300"
                onClick={advance}
              >
                {typed.done ? 'Continue' : 'Skip'}
                <Icon name="arrowRight" className="h-3 w-3 animate-nudge" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
