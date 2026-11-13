import { useCallback, useEffect, useRef, useState } from 'react';
import { sfx } from '../../audio/AudioEngine';
import { getState } from '../../state/store';

const SPEEDS: Record<string, number> = { relaxed: 44, normal: 26, fast: 13 };

/** Milliseconds per character for the player's chosen text speed. */
export function textSpeedMs() {
  return SPEEDS[getState().settings.textSpeed] ?? SPEEDS.normal;
}

interface Options {
  speed?: number;
  startDelay?: number;
  sound?: boolean;
  enabled?: boolean;
}

/** Reveals text one character at a time, with a manual skip-to-end. */
export function useTypewriter(text: string, options: Options = {}) {
  const { speed = 34, startDelay = 0, sound = true, enabled = true } = options;
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    setCount(0);
    started.current = false;
  }, [text]);

  useEffect(() => {
    if (!enabled) {
      setCount(text.length);
      return;
    }
    if (count >= text.length) return;
    const delay = started.current ? speed : speed + startDelay;
    const id = window.setTimeout(() => {
      started.current = true;
      setCount((c) => Math.min(text.length, c + 1));
      if (sound && count % 3 === 0 && text[count] !== ' ') sfx('type');
    }, delay);
    return () => window.clearTimeout(id);
  }, [count, text, speed, startDelay, sound, enabled]);

  const finish = useCallback(() => setCount(text.length), [text.length]);
  return { shown: text.slice(0, count), done: count >= text.length, finish };
}

interface TypewriterProps {
  text: string;
  speed?: number;
  startDelay?: number;
  className?: string;
  caret?: boolean;
  sound?: boolean;
  onDone?: () => void;
}

export function Typewriter({
  text,
  speed,
  startDelay,
  className,
  caret = true,
  sound = true,
  onDone,
}: TypewriterProps) {
  const { shown, done } = useTypewriter(text, { speed, startDelay, sound });
  const notified = useRef('');
  useEffect(() => {
    if (done && notified.current !== text) {
      notified.current = text;
      onDone?.();
    }
  }, [done, text, onDone]);

  return (
    <span className={className}>
      {shown}
      {caret && !done && <span className="animate-caret text-nav-300">▌</span>}
    </span>
  );
}
