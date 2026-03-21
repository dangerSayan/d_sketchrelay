// client/src/utils/sounds.js
// ═══════════════════════════════════════════════════════════════════════════
// CYBERPUNK SOUND ENGINE
// Pure Web Audio API — zero external assets.
// Every sound is procedurally synthesised to match the neon/dark aesthetic.
// ═══════════════════════════════════════════════════════════════════════════

class SoundManager {
  constructor() {
    this._ctx = null;
    this._masterGain = null;
    this._reverbBuffer = null;
    this._muted = localStorage.getItem("skribbl_muted") === "true";
  }

  // ── Context / Infrastructure ──────────────────────────────────────────────
  _getCtx() {
    if (!this._ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this._ctx = new AC();
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = 0.55;
      this._masterGain.connect(this._ctx.destination);
      this._buildReverb();
    }
    if (this._ctx.state === "suspended") this._ctx.resume();
    return this._ctx;
  }

  // Algorithmic reverb — convolution with synthetic impulse response
  _buildReverb() {
    const ctx = this._ctx;
    const length = ctx.sampleRate * 1.2;
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
      }
    }
    this._reverb = ctx.createConvolver();
    this._reverb.buffer = impulse;
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.18;
    this._reverb.connect(reverbGain);
    reverbGain.connect(this._masterGain);
  }

  get muted() {
    return this._muted;
  }
  toggleMute() {
    this._muted = !this._muted;
    localStorage.setItem("skribbl_muted", this._muted);
    return this._muted;
  }

  // ── Primitive Builders ────────────────────────────────────────────────────

  /**
   * Single oscillator with full ADSR envelope, optional reverb send.
   * @param {number} freq
   * @param {number} duration
   * @param {number} vol       peak gain 0–1
   * @param {string} type      OscillatorType
   * @param {number} pan       -1 to 1
   * @param {number} detune    cents
   * @param {number} delay     seconds from now
   * @param {number} attack    seconds
   * @param {number} decay     seconds
   * @param {number} sustain   0–1 fraction of vol
   * @param {boolean} reverb
   */
  _osc({
    freq,
    duration,
    vol = 0.2,
    type = "sine",
    pan = 0,
    detune = 0,
    delay = 0,
    attack = 0.008,
    decay = 0.1,
    sustain = 0.4,
    reverb = false,
  }) {
    if (this._muted) return;
    try {
      const ctx = this._getCtx();
      const t = ctx.currentTime + delay;

      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;

      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.setValueAtTime(freq * 6, t);
      filt.frequency.exponentialRampToValueAtTime(
        freq * 1.8,
        t + duration * 0.7,
      );
      filt.Q.value = 2;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(vol, t + attack);
      env.gain.linearRampToValueAtTime(vol * sustain, t + attack + decay);
      env.gain.setValueAtTime(vol * sustain, t + duration - 0.05);
      env.gain.linearRampToValueAtTime(0.0001, t + duration);

      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;

      osc.connect(filt);
      filt.connect(env);
      env.connect(panner);
      panner.connect(this._masterGain);
      if (reverb && this._reverb) panner.connect(this._reverb);

      osc.start(t);
      osc.stop(t + duration + 0.15);
    } catch (_) {}
  }

  /** Frequency sweep (laser / power-up feel) */
  _sweep({
    f0,
    f1,
    duration,
    vol = 0.2,
    type = "sawtooth",
    pan = 0,
    delay = 0,
    reverb = false,
  }) {
    if (this._muted) return;
    try {
      const ctx = this._getCtx();
      const t = ctx.currentTime + delay;

      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f1, t + duration);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(vol, t + 0.015);
      env.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;

      osc.connect(env);
      env.connect(panner);
      panner.connect(this._masterGain);
      if (reverb && this._reverb) panner.connect(this._reverb);

      osc.start(t);
      osc.stop(t + duration + 0.1);
    } catch (_) {}
  }

  /** White/pink noise burst */
  _noise({
    duration,
    vol = 0.15,
    filterType = "highpass",
    filterFreq = 2000,
    delay = 0,
    pan = 0,
  }) {
    if (this._muted) return;
    try {
      const ctx = this._getCtx();
      const t = ctx.currentTime + delay;
      const size = Math.ceil(ctx.sampleRate * duration);
      const buf = ctx.createBuffer(1, size, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = buf;

      const filt = ctx.createBiquadFilter();
      filt.type = filterType;
      filt.frequency.setValueAtTime(filterFreq, t);
      filt.frequency.exponentialRampToValueAtTime(80, t + duration);

      const env = ctx.createGain();
      env.gain.setValueAtTime(vol, t);
      env.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;

      src.connect(filt);
      filt.connect(env);
      env.connect(panner);
      panner.connect(this._masterGain);

      src.start(t);
    } catch (_) {}
  }

  // ══════════════════════════════════════════════════════════════════════════
  //   GAME SOUNDS — Cyberpunk Theme
  // ══════════════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────────────────
  // UI CLICK
  // Crisp laser blip. Feels precise, digital, instant.
  // ─────────────────────────────────────────────────────────────────────────
  click() {
    this._osc({
      freq: 1400,
      duration: 0.055,
      vol: 0.18,
      type: "square",
      pan: -0.15,
      attack: 0.002,
      decay: 0.02,
      sustain: 0,
    });
    this._osc({
      freq: 2100,
      duration: 0.04,
      vol: 0.1,
      type: "sine",
      pan: 0.15,
      delay: 0.01,
      attack: 0.002,
      decay: 0.015,
      sustain: 0,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CORRECT GUESS
  // Triumphant neon chord burst. Cyberpunk victory fanfare.
  // Sub bass thump → synth stabs → high shimmer → digital sparkle.
  // ─────────────────────────────────────────────────────────────────────────
  correctGuess() {
    // Sub bass punch
    this._osc({
      freq: 65,
      duration: 0.5,
      vol: 0.45,
      type: "sine",
      pan: 0,
      attack: 0.005,
      decay: 0.08,
      sustain: 0.2,
    });

    // Power chord (C4 – G4 – C5) staggered
    this._osc({
      freq: 261.63,
      duration: 0.55,
      vol: 0.22,
      type: "sawtooth",
      pan: -0.4,
      detune: -8,
      delay: 0,
      attack: 0.01,
      decay: 0.15,
      sustain: 0.5,
      reverb: true,
    });
    this._osc({
      freq: 392.0,
      duration: 0.55,
      vol: 0.2,
      type: "sawtooth",
      pan: 0.4,
      detune: 8,
      delay: 0.04,
      attack: 0.01,
      decay: 0.15,
      sustain: 0.5,
      reverb: true,
    });
    this._osc({
      freq: 523.25,
      duration: 0.55,
      vol: 0.18,
      type: "sawtooth",
      pan: -0.2,
      detune: -5,
      delay: 0.08,
      attack: 0.01,
      decay: 0.12,
      sustain: 0.4,
      reverb: true,
    });

    // High sine shimmer (neon glow effect)
    this._osc({
      freq: 1046.5,
      duration: 0.4,
      vol: 0.12,
      type: "sine",
      pan: 0.3,
      delay: 0.12,
      attack: 0.015,
      decay: 0.1,
      sustain: 0.2,
      reverb: true,
    });
    this._osc({
      freq: 1318.5,
      duration: 0.35,
      vol: 0.08,
      type: "sine",
      pan: -0.3,
      delay: 0.18,
      attack: 0.01,
      decay: 0.08,
      sustain: 0.1,
      reverb: true,
    });

    // Digital static burst
    this._noise({
      duration: 0.07,
      vol: 0.12,
      filterType: "highpass",
      filterFreq: 7000,
      delay: 0,
    });
    this._noise({
      duration: 0.05,
      vol: 0.08,
      filterType: "highpass",
      filterFreq: 9000,
      delay: 0.12,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TICK
  // Normal: precise digital metronome click.
  // Urgent: glitchy alarm pulse with distortion.
  // ─────────────────────────────────────────────────────────────────────────
  tick(urgent = false) {
    if (urgent) {
      // Alarm pulse — harsh square, sub thump, noise burst
      this._osc({
        freq: 180,
        duration: 0.12,
        vol: 0.45,
        type: "square",
        pan: -0.3,
        attack: 0.002,
        decay: 0.04,
        sustain: 0.1,
      });
      this._osc({
        freq: 360,
        duration: 0.1,
        vol: 0.3,
        type: "square",
        pan: 0.3,
        delay: 0.01,
        attack: 0.002,
        decay: 0.04,
        sustain: 0,
      });
      this._noise({
        duration: 0.06,
        vol: 0.2,
        filterType: "bandpass",
        filterFreq: 1200,
      });
    } else {
      // Clean digital ping
      this._osc({
        freq: 900,
        duration: 0.07,
        vol: 0.18,
        type: "sine",
        pan: -0.2,
        attack: 0.002,
        decay: 0.03,
        sustain: 0,
      });
      this._osc({
        freq: 1350,
        duration: 0.05,
        vol: 0.1,
        type: "sine",
        pan: 0.2,
        delay: 0.005,
        attack: 0.002,
        decay: 0.025,
        sustain: 0,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NEW ROUND
  // "Transmission incoming." Rising laser sweep + power chord stab.
  // Feels like a new mission briefing in a cyberpunk RPG.
  // ─────────────────────────────────────────────────────────────────────────
  newRound() {
    // Laser sweep up (incoming transmission)
    this._sweep({
      f0: 110,
      f1: 660,
      duration: 0.35,
      vol: 0.22,
      type: "sawtooth",
      pan: -0.3,
      reverb: true,
    });
    this._sweep({
      f0: 130,
      f1: 880,
      duration: 0.35,
      vol: 0.18,
      type: "sawtooth",
      pan: 0.3,
      delay: 0.02,
      reverb: true,
    });

    // Sub bass drop
    this._osc({
      freq: 55,
      duration: 0.5,
      vol: 0.4,
      type: "sine",
      pan: 0,
      delay: 0.32,
      attack: 0.01,
      decay: 0.12,
      sustain: 0.3,
    });

    // Chord stab (Fm power chord)
    this._osc({
      freq: 349.23,
      duration: 0.4,
      vol: 0.2,
      type: "sawtooth",
      pan: -0.3,
      detune: -6,
      delay: 0.34,
      attack: 0.008,
      decay: 0.12,
      sustain: 0.4,
      reverb: true,
    });
    this._osc({
      freq: 523.25,
      duration: 0.4,
      vol: 0.18,
      type: "sawtooth",
      pan: 0.3,
      detune: 6,
      delay: 0.34,
      attack: 0.008,
      decay: 0.12,
      sustain: 0.4,
      reverb: true,
    });

    // Noise transient at impact
    this._noise({
      duration: 0.08,
      vol: 0.18,
      filterType: "highpass",
      filterFreq: 3000,
      delay: 0.34,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PLAYER JOIN
  // "New operator online." Portal materialise sound — airy shimmer + data burst.
  // ─────────────────────────────────────────────────────────────────────────
  playerJoin() {
    // Rising data-stream sweep
    this._sweep({
      f0: 300,
      f1: 1200,
      duration: 0.25,
      vol: 0.18,
      type: "sine",
      pan: 0.2,
      reverb: true,
    });

    // Confirmation ping
    this._osc({
      freq: 880,
      duration: 0.15,
      vol: 0.14,
      type: "sine",
      pan: -0.2,
      delay: 0.2,
      attack: 0.01,
      decay: 0.08,
      sustain: 0.1,
    });
    this._osc({
      freq: 1320,
      duration: 0.12,
      vol: 0.1,
      type: "sine",
      pan: 0.2,
      delay: 0.26,
      attack: 0.008,
      decay: 0.06,
      sustain: 0,
    });

    // Soft static hiss
    this._noise({
      duration: 0.12,
      vol: 0.08,
      filterType: "highpass",
      filterFreq: 5000,
      delay: 0,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PLAYER LEAVE
  // "Signal lost." Descending glitch + power-down.
  // ─────────────────────────────────────────────────────────────────────────
  playerLeave() {
    // Descending glitch sweep
    this._sweep({
      f0: 800,
      f1: 80,
      duration: 0.4,
      vol: 0.2,
      type: "sawtooth",
      pan: -0.2,
    });

    // Broken noise (signal corruption)
    this._noise({
      duration: 0.05,
      vol: 0.18,
      filterType: "bandpass",
      filterFreq: 600,
      delay: 0,
    });
    this._noise({
      duration: 0.04,
      vol: 0.12,
      filterType: "bandpass",
      filterFreq: 300,
      delay: 0.08,
    });
    this._noise({
      duration: 0.04,
      vol: 0.08,
      filterType: "bandpass",
      filterFreq: 150,
      delay: 0.16,
    });

    // Low thud
    this._osc({
      freq: 80,
      duration: 0.3,
      vol: 0.28,
      type: "sine",
      pan: 0,
      delay: 0.15,
      attack: 0.01,
      decay: 0.1,
      sustain: 0.1,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WORD CHOSEN
  // "Target locked." Double laser lock-in with confirmation bass.
  // ─────────────────────────────────────────────────────────────────────────
  wordChosen() {
    // Lock blip 1
    this._osc({
      freq: 440,
      duration: 0.07,
      vol: 0.24,
      type: "square",
      pan: -0.3,
      attack: 0.003,
      decay: 0.04,
      sustain: 0,
    });
    // Lock blip 2 (higher — "acquired")
    this._osc({
      freq: 660,
      duration: 0.09,
      vol: 0.22,
      type: "square",
      pan: 0.3,
      delay: 0.07,
      attack: 0.003,
      decay: 0.05,
      sustain: 0,
    });
    // Final confirmation blip
    this._osc({
      freq: 880,
      duration: 0.12,
      vol: 0.18,
      type: "sine",
      pan: 0,
      delay: 0.14,
      attack: 0.005,
      decay: 0.07,
      sustain: 0.1,
      reverb: true,
    });

    // Sub bass pulse
    this._osc({
      freq: 110,
      duration: 0.2,
      vol: 0.3,
      type: "sine",
      pan: 0,
      delay: 0.07,
      attack: 0.01,
      decay: 0.08,
      sustain: 0.15,
    });

    // Crisp noise click at each blip
    this._noise({
      duration: 0.03,
      vol: 0.12,
      filterType: "highpass",
      filterFreq: 4000,
      delay: 0,
    });
    this._noise({
      duration: 0.03,
      vol: 0.1,
      filterType: "highpass",
      filterFreq: 5000,
      delay: 0.07,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CLOSE GUESS
  // "Proximity alert." Warm nudge — not a win, not a fail.
  // Two synth tones slightly off from the "correct" interval.
  // ─────────────────────────────────────────────────────────────────────────
  closeGuess() {
    this._osc({
      freq: 370,
      duration: 0.18,
      vol: 0.18,
      type: "triangle",
      pan: -0.2,
      attack: 0.01,
      decay: 0.07,
      sustain: 0.3,
    });
    this._osc({
      freq: 494,
      duration: 0.22,
      vol: 0.16,
      type: "triangle",
      pan: 0.2,
      delay: 0.09,
      attack: 0.01,
      decay: 0.08,
      sustain: 0.2,
      reverb: true,
    });
    this._noise({
      duration: 0.05,
      vol: 0.06,
      filterType: "highpass",
      filterFreq: 3000,
      delay: 0.09,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GAME OVER
  // "System shutdown." Cinematic descending arpeggio with bass slam
  // and crackling digital debris. Sad but dramatic.
  // ─────────────────────────────────────────────────────────────────────────
  gameOver() {
    // Descending neon arpeggio (Am — dark, cyberpunk)
    const notes = [
      { freq: 880, delay: 0 },
      { freq: 783.99, delay: 0.13 },
      { freq: 659.25, delay: 0.26 },
      { freq: 587.33, delay: 0.39 },
      { freq: 523.25, delay: 0.52 },
      { freq: 440, delay: 0.65 },
    ];
    notes.forEach(({ freq, delay }, i) => {
      const pan = (i % 2 === 0 ? -1 : 1) * 0.35;
      this._osc({
        freq,
        duration: 0.45,
        vol: 0.18,
        type: "sawtooth",
        pan,
        detune: i % 2 === 0 ? -6 : 6,
        delay,
        attack: 0.01,
        decay: 0.15,
        sustain: 0.35,
        reverb: true,
      });
    });

    // Massive sub bass slam
    this._osc({
      freq: 55,
      duration: 1.2,
      vol: 0.5,
      type: "sine",
      pan: 0,
      delay: 0.65,
      attack: 0.01,
      decay: 0.2,
      sustain: 0.3,
    });
    this._osc({
      freq: 110,
      duration: 1.0,
      vol: 0.3,
      type: "sawtooth",
      pan: 0,
      delay: 0.65,
      attack: 0.01,
      decay: 0.2,
      sustain: 0.2,
      reverb: true,
    });

    // Digital debris — layered noise bursts
    this._noise({
      duration: 0.6,
      vol: 0.22,
      filterType: "highpass",
      filterFreq: 800,
      delay: 0.65,
    });
    this._noise({
      duration: 0.4,
      vol: 0.15,
      filterType: "lowpass",
      filterFreq: 2000,
      delay: 0.65,
    });

    // Glitch crackle trail
    [0.8, 0.95, 1.1, 1.25].forEach((d) => {
      this._noise({
        duration: 0.04,
        vol: 0.1,
        filterType: "bandpass",
        filterFreq: 400 + Math.random() * 1200,
        delay: d,
      });
    });

    // Final low sweep to silence
    this._sweep({
      f0: 220,
      f1: 40,
      duration: 0.8,
      vol: 0.2,
      type: "sawtooth",
      pan: 0,
      delay: 1.0,
      reverb: true,
    });
  }
}

export const sounds = new SoundManager();
