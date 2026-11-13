/**
 * Every sound in NASA LAST MISSION is synthesised at runtime with the Web
 * Audio API — there are no audio files to download, and nothing plays until the
 * player has interacted with the page (browser autoplay rules).
 */

export type SfxName =
  | 'ui_click'
  | 'ui_hover'
  | 'ui_open'
  | 'ui_close'
  | 'type'
  | 'collect'
  | 'discover'
  | 'objective'
  | 'warn'
  | 'alarm'
  | 'footstep'
  | 'water'
  | 'plant'
  | 'build'
  | 'power'
  | 'harvest'
  | 'transmit'
  | 'rumble'
  | 'whoosh'
  | 'airlock'
  | 'thought';

type Mix = { master: number; music: number; sfx: number };

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private musicGain!: GainNode;
  private sfxGain!: GainNode;
  private noiseBuffer: AudioBuffer | null = null;

  private windSource: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private musicNodes: AudioNode[] = [];
  private musicTimer: number | null = null;
  private chordIndex = 0;

  private mix: Mix = { master: 0.75, music: 0.5, sfx: 0.8 };
  private ambientWanted = false;
  private lastStep = 0;

  get ready() {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  /** Must be called from a user gesture. Safe to call repeatedly. */
  unlock() {
    if (!this.ctx) {
      type WithWebkit = typeof window & { webkitAudioContext?: typeof AudioContext };
      const Ctor = window.AudioContext ?? (window as WithWebkit).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.mix.master;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.mix.music;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.mix.sfx;
      this.sfxGain.connect(this.masterGain);

      this.noiseBuffer = this.makeNoise(2.5);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    if (this.ambientWanted) this.startAmbient();
  }

  setMix(mix: Partial<Mix>) {
    this.mix = { ...this.mix, ...mix };
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.mix.master, t, 0.05);
    this.musicGain.gain.setTargetAtTime(this.mix.music, t, 0.05);
    this.sfxGain.gain.setTargetAtTime(this.mix.sfx, t, 0.05);
  }

  private makeNoise(seconds: number) {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Brown-ish noise: smoother and less hissy than white.
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    return buffer;
  }

  /* ----------------------------------------------------------
     Ambience: Martian wind + slow cinematic pad
     ---------------------------------------------------------- */
  startAmbient() {
    this.ambientWanted = true;
    if (!this.ctx || !this.noiseBuffer || this.windSource) return;
    const ctx = this.ctx;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.8;

    const gain = ctx.createGain();
    gain.gain.value = 0.0;

    src.connect(filter).connect(gain).connect(this.musicGain);
    src.start();
    gain.gain.setTargetAtTime(0.32, ctx.currentTime, 2.5);

    // Slow gusts.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.055;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.17;
    lfo.connect(lfoGain).connect(gain.gain);
    lfo.start();

    const lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.031;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 190;
    lfo2.connect(lfo2Gain).connect(filter.frequency);
    lfo2.start();

    this.windSource = src;
    this.windGain = gain;
    this.windFilter = filter;
    this.musicNodes.push(lfo, lfo2);

    this.startPad();
  }

  /** A passing dust gust: a brief swell in the wind bed. */
  gust() {
    if (!this.ctx || !this.windGain || !this.windFilter) return;
    const t = this.ctx.currentTime;
    const base = this.windGain.gain.value;
    this.windGain.gain.cancelScheduledValues(t);
    this.windGain.gain.setValueAtTime(base, t);
    this.windGain.gain.linearRampToValueAtTime(Math.min(0.62, base + 0.26), t + 1.4);
    this.windGain.gain.linearRampToValueAtTime(base, t + 4.6);
    this.windFilter.frequency.cancelScheduledValues(t);
    this.windFilter.frequency.setValueAtTime(this.windFilter.frequency.value, t);
    this.windFilter.frequency.linearRampToValueAtTime(760, t + 1.4);
    this.windFilter.frequency.linearRampToValueAtTime(440, t + 4.6);
  }

  /** Lifts the music bed for a beat at a milestone. */
  swell() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const gain = this.musicGain.gain;
    const base = this.mix.music;
    gain.cancelScheduledValues(t);
    gain.setValueAtTime(gain.value, t);
    gain.linearRampToValueAtTime(Math.min(1, base * 1.7), t + 0.5);
    gain.linearRampToValueAtTime(base, t + 4.5);
    [261.63, 392, 523.25, 659.25].forEach((f, i) => {
      this.tone(f, { type: 'sine', dur: 2.6, gain: 0.05, delay: i * 0.08, filter: 2400 });
    });
  }

  /** Louder, grittier wind while outside; softer when sheltered. */
  setExposure(outside: boolean) {
    if (!this.ctx || !this.windGain || !this.windFilter) return;
    const t = this.ctx.currentTime;
    this.windGain.gain.setTargetAtTime(outside ? 0.32 : 0.08, t, 1.2);
    this.windFilter.frequency.setTargetAtTime(outside ? 460 : 190, t, 1.2);
  }

  private startPad() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.56;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.34;
    const wet = ctx.createGain();
    wet.gain.value = 0.3;
    delay.connect(feedback).connect(delay);
    delay.connect(wet).connect(this.musicGain);

    const chords = [
      [110, 164.81, 220, 329.63], // Am
      [87.31, 130.81, 174.61, 261.63], // F
      [98, 146.83, 196, 293.66], // G
      [82.41, 123.47, 164.81, 246.94], // E
    ];

    const playChord = () => {
      if (!this.ctx) return;
      const chord = chords[this.chordIndex % chords.length];
      this.chordIndex++;
      const now = ctx.currentTime;
      const dur = 9.5;
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        osc.detune.value = (Math.random() - 0.5) * 9;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 700 + i * 180;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.055 / (i + 1) + 0.012, now + 3.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        osc.connect(filter).connect(gain);
        gain.connect(this.musicGain);
        gain.connect(delay);
        osc.start(now);
        osc.stop(now + dur + 0.2);
      });

      // Occasional lonely high note.
      if (Math.random() < 0.55) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        const scale = [659.25, 783.99, 880, 987.77, 1174.66];
        osc.frequency.value = scale[Math.floor(Math.random() * scale.length)];
        const gain = ctx.createGain();
        const start = now + 2 + Math.random() * 3;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.03, start + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 3.6);
        osc.connect(gain);
        gain.connect(delay);
        gain.connect(this.musicGain);
        osc.start(start);
        osc.stop(start + 4);
      }
    };

    playChord();
    this.musicTimer = window.setInterval(playChord, 9000);
  }

  stopAmbient() {
    this.ambientWanted = false;
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ctx && this.windGain) {
      this.windGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.6);
    }
    const src = this.windSource;
    if (src) {
      window.setTimeout(() => {
        try {
          src.stop();
        } catch {
          /* already stopped */
        }
      }, 1400);
    }
    this.windSource = null;
    this.windGain = null;
    this.musicNodes.forEach((n) => {
      const osc = n as OscillatorNode;
      try {
        osc.stop?.();
      } catch {
        /* noop */
      }
    });
    this.musicNodes = [];
  }

  /* ----------------------------------------------------------
     One-shot effects
     ---------------------------------------------------------- */
  private tone(
    freq: number,
    opts: {
      type?: OscillatorType;
      dur?: number;
      gain?: number;
      slideTo?: number;
      delay?: number;
      filter?: number;
    } = {},
  ) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const dur = opts.dur ?? 0.2;
    const osc = ctx.createOscillator();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);

    const gain = ctx.createGain();
    const peak = opts.gain ?? 0.18;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.03, dur * 0.3));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    let node: AudioNode = osc;
    if (opts.filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = opts.filter;
      node = osc.connect(f);
    }
    node.connect(gain).connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  private noise(
    opts: {
      dur?: number;
      gain?: number;
      type?: BiquadFilterType;
      freq?: number;
      slideTo?: number;
      q?: number;
      delay?: number;
    } = {},
  ) {
    if (!this.ctx || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const dur = opts.dur ?? 0.2;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = opts.type ?? 'bandpass';
    filter.frequency.setValueAtTime(opts.freq ?? 900, t0);
    filter.Q.value = opts.q ?? 1;
    if (opts.slideTo) filter.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
    const gain = ctx.createGain();
    const peak = opts.gain ?? 0.12;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + dur * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(this.sfxGain);
    src.start(t0, Math.random() * 1.5);
    src.stop(t0 + dur + 0.05);
  }

  play(name: SfxName) {
    if (!this.ctx) return;
    switch (name) {
      case 'ui_hover':
        this.tone(1180, { type: 'sine', dur: 0.05, gain: 0.025 });
        break;
      case 'ui_click':
        this.tone(660, { type: 'sine', dur: 0.07, gain: 0.065, slideTo: 980, filter: 2600 });
        this.noise({ dur: 0.05, gain: 0.015, freq: 2600, q: 1.4 });
        break;
      case 'ui_open':
        this.tone(420, { type: 'triangle', dur: 0.22, gain: 0.08, slideTo: 980 });
        this.noise({ dur: 0.22, gain: 0.035, freq: 900, slideTo: 2600, q: 0.8 });
        break;
      case 'ui_close':
        this.tone(900, { type: 'triangle', dur: 0.18, gain: 0.07, slideTo: 380 });
        break;
      case 'type':
        this.tone(1500 + Math.random() * 300, { type: 'square', dur: 0.016, gain: 0.012 });
        break;
      case 'collect':
        this.tone(587.33, { type: 'sine', dur: 0.24, gain: 0.1, filter: 3000 });
        this.tone(880, { type: 'sine', dur: 0.42, gain: 0.08, delay: 0.07, filter: 3200 });
        this.tone(1174.66, { type: 'sine', dur: 0.5, gain: 0.045, delay: 0.14, filter: 3400 });
        this.noise({ dur: 0.22, gain: 0.025, freq: 1800, slideTo: 500 });
        break;
      case 'discover':
        [523.25, 659.25, 783.99].forEach((f, i) =>
          this.tone(f, { type: 'sine', dur: 0.5, gain: 0.09, delay: i * 0.1 }),
        );
        break;
      case 'objective':
        [587.33, 880].forEach((f, i) =>
          this.tone(f, { type: 'triangle', dur: 0.45, gain: 0.1, delay: i * 0.13 }),
        );
        break;
      case 'warn':
        this.tone(392, { type: 'sine', dur: 0.34, gain: 0.055, filter: 1200 });
        this.tone(329.63, { type: 'sine', dur: 0.42, gain: 0.05, filter: 1100, delay: 0.3 });
        break;
      case 'alarm':
        for (let i = 0; i < 3; i++) {
          this.tone(740, { type: 'sawtooth', dur: 0.18, gain: 0.08, filter: 1400, delay: i * 0.3 });
          this.tone(560, { type: 'sawtooth', dur: 0.18, gain: 0.07, filter: 1200, delay: i * 0.3 + 0.14 });
        }
        break;
      case 'footstep': {
        const now = performance.now();
        if (now - this.lastStep < 90) return;
        this.lastStep = now;
        this.noise({
          dur: 0.1 + Math.random() * 0.05,
          gain: 0.045 + Math.random() * 0.025,
          type: 'lowpass',
          freq: 380 + Math.random() * 420,
          slideTo: 220 + Math.random() * 140,
          q: 0.7,
        });
        break;
      }
      case 'water':
        this.noise({ dur: 0.75, gain: 0.08, type: 'bandpass', freq: 2400, slideTo: 420, q: 2.4 });
        break;
      case 'plant':
        this.noise({ dur: 0.3, gain: 0.07, type: 'lowpass', freq: 700, q: 0.7 });
        this.tone(220, { type: 'sine', dur: 0.2, gain: 0.07 });
        break;
      case 'build':
        for (let i = 0; i < 3; i++) {
          this.tone(130 + i * 40, { type: 'triangle', dur: 0.22, gain: 0.11, delay: i * 0.22, filter: 1200 });
          this.noise({ dur: 0.14, gain: 0.05, type: 'lowpass', freq: 1100, delay: i * 0.22 });
        }
        [523.25, 659.25, 880].forEach((f, i) =>
          this.tone(f, { type: 'sine', dur: 0.7, gain: 0.09, delay: 0.72 + i * 0.1 }),
        );
        break;
      case 'power':
        this.tone(90, { type: 'sawtooth', dur: 1.1, gain: 0.09, slideTo: 320, filter: 900 });
        this.tone(440, { type: 'sine', dur: 0.8, gain: 0.05, delay: 0.5 });
        break;
      case 'harvest':
        [659.25, 880, 1174.66].forEach((f, i) =>
          this.tone(f, { type: 'sine', dur: 0.6, gain: 0.1, delay: i * 0.09 }),
        );
        this.noise({ dur: 0.3, gain: 0.04, freq: 1800, slideTo: 500 });
        break;
      case 'transmit':
        this.tone(180, { type: 'sine', dur: 2.6, gain: 0.1, slideTo: 720 });
        this.tone(360, { type: 'triangle', dur: 2.2, gain: 0.05, slideTo: 1440, delay: 0.2 });
        this.noise({ dur: 2.4, gain: 0.04, type: 'bandpass', freq: 600, slideTo: 3200, q: 3 });
        break;
      case 'rumble':
        this.noise({ dur: 2.2, gain: 0.22, type: 'lowpass', freq: 260, slideTo: 70, q: 0.6 });
        this.tone(52, { type: 'sine', dur: 2.4, gain: 0.16 });
        break;
      case 'airlock': {
        // Seal release, a long equalising hiss, then the latch.
        this.tone(96, { type: 'sine', dur: 0.26, gain: 0.1, filter: 700 });
        this.noise({ dur: 1.5, gain: 0.07, type: 'bandpass', freq: 420, slideTo: 2600, q: 0.9, delay: 0.12 });
        this.noise({ dur: 0.9, gain: 0.04, type: 'highpass', freq: 1800, delay: 0.5 });
        this.tone(140, { type: 'triangle', dur: 0.2, gain: 0.09, filter: 900, delay: 1.3 });
        break;
      }
      case 'thought':
        this.tone(1046.5, { type: 'sine', dur: 0.4, gain: 0.03, filter: 2600 });
        this.tone(1318.5, { type: 'sine', dur: 0.5, gain: 0.022, filter: 2800, delay: 0.1 });
        break;
      case 'whoosh':
        this.noise({ dur: 0.9, gain: 0.1, type: 'bandpass', freq: 320, slideTo: 2600, q: 1.2 });
        break;
    }
  }
}

export const audio = new AudioEngine();

/** Shorthand used across the UI. */
export const sfx = (name: SfxName) => audio.play(name);
