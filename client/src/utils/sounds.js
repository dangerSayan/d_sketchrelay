// client/src/utils/sounds.js
// All sounds generated programmatically using the Web Audio API.
// Cyberpunk / retro-synth aesthetic — every sound uses layered oscillators,
// filtered noise, and envelope shaping. Zero audio files needed.

class SoundManager {
  constructor() {
    this._ctx = null;
    this._muted = localStorage.getItem("skribbl_muted") === "true";
  }

  // Lazy-create the AudioContext on first user interaction
  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
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

  // ── Core tone builder ─────────────────────────────────────────────────────
  // Returns a connected GainNode so callers can chain effects.
  _tone(
    freq,
    duration = 0.15,
    volume = 0.3,
    type = "sine",
    delay = 0,
    dest = null,
  ) {
    if (this._muted) return null;
    try {
      const ctx = this._getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(dest || ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(
        volume,
        ctx.currentTime + delay + 0.012,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + delay + duration,
      );
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.05);
      return gain;
    } catch (_) {
      return null;
    }
  }

  // ── White noise burst (for pops, clicks, sweeps) ──────────────────────────
  _noise(duration = 0.1, volume = 0.15, delay = 0, highpass = 2000) {
    if (this._muted) return;
    try {
      const ctx = this._getCtx();
      const bufSize = ctx.sampleRate * (duration + 0.05);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = highpass;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + delay + duration,
      );

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(ctx.currentTime + delay);
      src.stop(ctx.currentTime + delay + duration + 0.05);
    } catch (_) {}
  }

  // ── Frequency sweep (pitch ramp) ──────────────────────────────────────────
  _sweep(
    freqFrom,
    freqTo,
    duration = 0.2,
    volume = 0.25,
    type = "sawtooth",
    delay = 0,
  ) {
    if (this._muted) return;
    try {
      const ctx = this._getCtx();
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(freqTo * 3, ctx.currentTime + delay);
      filter.frequency.exponentialRampToValueAtTime(
        400,
        ctx.currentTime + delay + duration,
      );

      osc.type = type;
      osc.frequency.setValueAtTime(freqFrom, ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(
        freqTo,
        ctx.currentTime + delay + duration,
      );

      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + delay + duration,
      );

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.05);
    } catch (_) {}
  }

  // ── Correct guess — neon chime cascade + shimmer ──────────────────────────
  // Layered: pure sine chord → bright harmonics → noise shimmer
  correctGuess() {
    if (this._muted) return;
    try {
      const ctx = this._getCtx();

      // Chord: C5 + E5 + G5 — sine fundamentals
      this._tone(523.25, 0.35, 0.28, "sine", 0); // C5
      this._tone(659.25, 0.35, 0.28, "sine", 0.07); // E5
      this._tone(783.99, 0.4, 0.28, "sine", 0.14); // G5
      this._tone(1046.5, 0.3, 0.14, "sine", 0.21); // C6 octave shimmer

      // Subtle triangle sub-layer for warmth
      this._tone(261.63, 0.4, 0.12, "triangle", 0); // C4 sub

      // Bright square harmonics — the "neon" edge
      this._tone(1318.5, 0.18, 0.06, "square", 0.1); // E6 bright tick
      this._tone(1567.98, 0.15, 0.05, "square", 0.2); // G6 bright tick

      // Noise shimmer
      this._noise(0.25, 0.06, 0, 4000);
    } catch (_) {}
  }

  // ── Timer tick — crisp cyberpunk click ────────────────────────────────────
  tick(urgent = false) {
    if (this._muted) return;
    if (urgent) {
      // Urgent: sharp sawtooth blip + noise snap
      this._tone(880, 0.06, 0.35, "sawtooth", 0);
      this._tone(440, 0.04, 0.2, "square", 0.03);
      this._noise(0.05, 0.2, 0, 3000);
    } else {
      // Normal: clean sine click with faint overtone
      this._tone(440, 0.045, 0.18, "sine", 0);
      this._tone(880, 0.03, 0.06, "sine", 0.01);
    }
  }

  // ── New round — power-up synth sweep ─────────────────────────────────────
  newRound() {
    if (this._muted) return;
    // Rising arp + filtered sweep + noise burst
    this._tone(220, 0.08, 0.22, "sawtooth", 0);
    this._tone(330, 0.08, 0.22, "sawtooth", 0.07);
    this._tone(440, 0.08, 0.22, "sawtooth", 0.14);
    this._tone(550, 0.08, 0.22, "sawtooth", 0.21);
    this._tone(660, 0.14, 0.25, "sawtooth", 0.28);

    // Bright sine overlay — "arcade ready" feel
    this._tone(880, 0.1, 0.15, "sine", 0.28);
    this._tone(1100, 0.12, 0.12, "sine", 0.35);

    // Frequency sweep whoosh
    this._sweep(180, 1200, 0.38, 0.1, "sawtooth", 0);

    // Noise punch at start
    this._noise(0.12, 0.15, 0, 1500);
  }

  // ── Player join — neon "bloop" ────────────────────────────────────────────
  playerJoin() {
    if (this._muted) return;
    // Soft upward frequency bounce
    this._sweep(300, 700, 0.12, 0.18, "sine", 0);
    this._tone(700, 0.1, 0.15, "sine", 0.1);
    this._noise(0.06, 0.06, 0.08, 5000);
  }

  // ── Player leave — descending power-down ──────────────────────────────────
  playerLeave() {
    if (this._muted) return;
    this._sweep(600, 120, 0.22, 0.18, "sawtooth", 0);
    this._tone(160, 0.18, 0.1, "triangle", 0.15);
    this._noise(0.08, 0.08, 0, 500);
  }

  // ── Word chosen — "locked in" confirmation blip ───────────────────────────
  wordChosen() {
    if (this._muted) return;
    // Two-tone confirm: square tick then sine resolve
    this._tone(440, 0.06, 0.25, "square", 0);
    this._tone(880, 0.06, 0.22, "square", 0.07);
    this._tone(1320, 0.14, 0.2, "sine", 0.13);
    this._noise(0.08, 0.08, 0, 4000);
  }

  // ── Close guess — subtle "warm" nudge ────────────────────────────────────
  closeGuess() {
    if (this._muted) return;
    this._tone(350, 0.1, 0.18, "triangle", 0);
    this._tone(420, 0.08, 0.12, "triangle", 0.08);
  }

  // ── Game over — descending fanfare ────────────────────────────────────────
  gameOver() {
    if (this._muted) return;
    // Descending arp
    this._tone(880, 0.1, 0.25, "sawtooth", 0);
    this._tone(784, 0.1, 0.25, "sawtooth", 0.1);
    this._tone(659, 0.1, 0.25, "sawtooth", 0.2);
    this._tone(523, 0.25, 0.28, "sawtooth", 0.3);
    // Sub rumble
    this._tone(110, 0.4, 0.15, "triangle", 0.3);
    // Noise burst
    this._noise(0.3, 0.18, 0.3, 200);
  }
}

// Export a singleton — one instance shared across the whole app
export const sounds = new SoundManager();
