// client/src/utils/sounds.js
// Modern Retro Gaming Sound Engine
// Uses Web Audio API to generate layered, stereo-panned, fat synth sounds.
// No external assets required.

class SoundManager {
  constructor() {
    this._ctx = null;
    this._masterGain = null;
    this._muted = localStorage.getItem("skribbl_muted") === "true";
  }

  // ── Context Management ─────────────────────────────────────────────────────
  _getCtx() {
    if (!this._ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this._ctx = new AudioContext();

      // Create a master gain node to prevent clipping when layers are stacked
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = 0.6; // Master volume cap
      this._masterGain.connect(this._ctx.destination);
    }
    if (this._ctx.state === "suspended") this._ctx.resume();
    return this._ctx;
  }

  get muted() {
    return this._muted;
  }

  toggleMute() {
    this._muted = !this._muted;
    localStorage.setItem("skribbl_muted", this._muted);
    return this._muted;
  }

  // ── Core Sound Generator (The "Engine") ───────────────────────────────────
  // Generates a "fat" synth tone.
  // Supports stereo panning, detuning (thickness), and waveform shaping.
  _playSynthTone(
    freq,
    duration,
    vol,
    type = "sawtooth",
    pan = 0,
    detune = 0,
    delay = 0,
  ) {
    if (this._muted) return;
    try {
      const ctx = this._getCtx();
      const t = ctx.currentTime + delay;

      // 1. Panner (Stereo Width)
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;

      // 2. Filter (Analog warmth)
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(freq * 4, t);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.5, t + duration);

      // 3. Gain (Envelope - ADSR)
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.01); // Fast Attack
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration); // Decay

      // 4. Oscillator
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune; // Detuning creates the "thick" chorus effect

      // Connect graph
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(this._masterGain);

      osc.start(t);
      osc.stop(t + duration + 0.1);
    } catch (e) {
      console.error(e);
    }
  }

  // ── Noise Generator (For snares, hi-hats, explosions) ───────────────────
  _playNoise(
    duration,
    vol,
    filterType = "highpass",
    filterFreq = 1000,
    delay = 0,
  ) {
    if (this._muted) return;
    try {
      const ctx = this._getCtx();
      const t = ctx.currentTime + delay;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate white noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(filterFreq, t);
      filter.frequency.exponentialRampToValueAtTime(100, t + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this._masterGain);

      noise.start(t);
    } catch (e) {}
  }

  // ── Sweep Generator (For lasers, power-ups, UI slides) ───────────────────
  _playSweep(startFreq, endFreq, duration, vol, type = "sine", delay = 0) {
    if (this._muted) return;
    try {
      const ctx = this._getCtx();
      const t = ctx.currentTime + delay;

      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.02);
      gain.gain.linearRampToValueAtTime(0, t + duration);

      osc.connect(gain);
      gain.connect(this._masterGain);
      osc.start(t);
      osc.stop(t + duration + 0.1);
    } catch (e) {}
  }

  // ─────────────────────────────────────────────────────────────────────────
  //                           GAME SOUNDS
  // ─────────────────────────────────────────────────────────────────────────

  // ── UI / Interaction Sounds ───────────────────────────────────────────────

  /** A crisp, futuristic "Click" used for Copy Link/Code */
  click() {
    // High tech "blip"
    this._playSynthTone(1200, 0.05, 0.2, "sine", -0.2, 0);
    this._playSynthTone(1800, 0.04, 0.15, "sine", 0.2, 5); // Slight detune stereo
    this._playSynthTone(2400, 0.03, 0.1, "square", 0, 0, 0.01); // Tiny metallic tick
  }

  // ── Game Event Sounds ────────────────────────────────────────────────────

  /**
   * Correct Guess
   * A lush, triumphant major chord arpeggio with a sub-bass drop.
   * Sounds like a classic arcade jingle but polished.
   */
  correctGuess() {
    // Sub Bass Drop (Root C3)
    this._playSynthTone(130.81, 0.6, 0.4, "sawtooth", 0, 10);

    // The Arpeggio (C Major 7: C4, E4, G4, B4, C5)
    // Panned slightly to create movement
    this._playSynthTone(261.63, 0.2, 0.15, "square", -0.3, 0, 0); // C4
    this._playSynthTone(329.63, 0.2, 0.15, "square", -0.1, 0, 0.05); // E4
    this._playSynthTone(392.0, 0.2, 0.15, "square", 0.1, 0, 0.1); // G4
    this._playSynthTone(493.88, 0.3, 0.12, "square", 0.3, 0, 0.15); // B4

    // Top sparkle (Sine)
    this._playSynthTone(523.25, 0.5, 0.15, "sine", 0, 0, 0.2); // C5

    // Sparkle Noise (Hi-hat shimmer)
    this._playNoise(0.1, 0.1, "highpass", 8000, 0.2);
  }

  /**
   * Timer Tick
   * Rhythmic, distinct.
   */
  tick(urgent = false) {
    if (urgent) {
      // Urgent: Deeper, sharper attack, alarm-like
      this._playSynthTone(200, 0.08, 0.4, "square", 0, 0);
      this._playNoise(0.08, 0.15, "highpass", 2000);
    } else {
      // Normal: Clean "woodblock" / high ping
      this._playSynthTone(800, 0.04, 0.2, "sine", -0.2, 0);
      this._playSynthTone(1200, 0.03, 0.1, "sine", 0.2, 0);
    }
  }

  /**
   * New Round
   * A rising power-up sweep. Indicates "Level Up" or "Next Stage".
   */
  newRound() {
    // Laser sweep up
    this._playSweep(150, 880, 0.4, 0.3, "sawtooth", 0);

    // Bass kick
    this._playSynthTone(60, 0.3, 0.5, "sine", 0, 0, 0.3);

    // Chord stabs at the end (F Major)
    this._playSynthTone(349.23, 0.3, 0.15, "square", -0.2, 0, 0.35); // F4
    this._playSynthTone(440.0, 0.3, 0.15, "square", 0.2, 0, 0.35); // A4
    this._playSynthTone(523.25, 0.3, 0.15, "square", 0, 0, 0.35); // C5
  }

  /**
   * Player Join
   * A friendly, airy "portal open" sound.
   */
  playerJoin() {
    // Rising sine sweep (Air)
    this._playSweep(400, 800, 0.2, 0.2, "sine", 0);

    // Soft "pop"
    this._playSynthTone(600, 0.1, 0.1, "triangle", 0, 0, 0.15);
  }

  /**
   * Player Leave
   * A descending, slightly glitchy "power down".
   */
  playerLeave() {
    // Descending sweep
    this._playSweep(600, 150, 0.3, 0.2, "sawtooth", 0);

    // Low rumble fade out
    this._playSynthTone(100, 0.4, 0.3, "triangle", 0, 0, 0.1);
  }

  /**
   * Word Chosen
   * A satisfying "Lock in" sound. Double blip.
   */
  wordChosen() {
    // Primary blip
    this._playSynthTone(440, 0.05, 0.25, "square", -0.2, 0);
    // Secondary blip (higher pitch)
    this._playSynthTone(880, 0.1, 0.2, "sine", 0.2, 0, 0.06);
    // Subtle bass confirmation
    this._playSynthTone(110, 0.15, 0.3, "triangle", 0, 0, 0.05);
  }

  /**
   * Close Guess
   * A warm, encouraging "nudge". Not a failure, not a win.
   */
  closeGuess() {
    // Two notes moving upward (Major 3rd interval)
    this._playSynthTone(300, 0.15, 0.2, "triangle", 0, 0, 0);
    this._playSynthTone(375, 0.2, 0.2, "triangle", 0, 0, 0.1);
  }

  /**
   * Game Over
   * Epic, descending fanfare with a crash.
   */
  gameOver() {
    // Sad Descending Arpeggio (Am7)
    this._playSynthTone(880, 0.2, 0.15, "sawtooth", 0, 5, 0); // A5
    this._playSynthTone(783, 0.2, 0.15, "sawtooth", 0.2, 5, 0.1); // G5
    this._playSynthTone(659, 0.2, 0.15, "sawtooth", -0.2, 5, 0.2); // E5
    this._playSynthTone(587, 0.4, 0.2, "sawtooth", 0, 5, 0.3); // D5
    this._playSynthTone(440, 0.6, 0.25, "sawtooth", 0, 5, 0.4); // A4

    // Low impact bass
    this._playSynthTone(55, 0.8, 0.5, "sawtooth", 0, 0, 0.4);

    // Cymbal crash / Noise burst
    this._playNoise(0.8, 0.3, "highpass", 500, 0.4);
    this._playNoise(0.8, 0.3, "lowpass", 3000, 0.4);
  }
}

export const sounds = new SoundManager();
