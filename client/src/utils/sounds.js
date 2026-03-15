// client/src/utils/sounds.js
// All sounds generated programmatically using the Web Audio API.
// No audio files needed — every sound is created with oscillators and
// gain nodes. This means zero loading time and works everywhere.

class SoundManager {
  constructor() {
    this._ctx = null;
    this._muted = localStorage.getItem("skribbl_muted") === "true";
  }

  // Lazy-create the AudioContext on first user interaction
  // (browsers block AudioContext creation before a user gesture)
  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (some browsers suspend on page load)
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

  // ── Play a single tone ────────────────────────────────────────────────────
  // freq: Hz, type: oscillator waveform, duration: seconds, volume: 0-1
  _tone(freq, duration = 0.15, volume = 0.3, type = "sine", delay = 0) {
    if (this._muted) return;
    try {
      const ctx = this._getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + delay + duration,
      );

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.05);
    } catch (_) {
      /* audio not supported */
    }
  }

  // ── Correct guess — ascending 3-note chime ────────────────────────────────
  correctGuess() {
    this._tone(523, 0.12, 0.4, "sine", 0); // C5
    this._tone(659, 0.12, 0.4, "sine", 0.1); // E5
    this._tone(784, 0.2, 0.4, "sine", 0.2); // G5
  }

  // ── Timer tick — short click ──────────────────────────────────────────────
  tick(urgent = false) {
    this._tone(urgent ? 880 : 440, 0.05, urgent ? 0.5 : 0.25, "square");
  }

  // ── New round — rising whoosh ─────────────────────────────────────────────
  newRound() {
    this._tone(330, 0.1, 0.3, "sine", 0);
    this._tone(440, 0.1, 0.3, "sine", 0.08);
    this._tone(550, 0.15, 0.35, "sine", 0.16);
  }

  // ── Player join — soft pop ────────────────────────────────────────────────
  playerJoin() {
    this._tone(600, 0.08, 0.25, "sine", 0);
    this._tone(800, 0.1, 0.2, "sine", 0.06);
  }

  // ── Player leave — muted thud ─────────────────────────────────────────────
  playerLeave() {
    this._tone(200, 0.15, 0.2, "triangle");
  }

  // ── Word chosen — short ready sound ──────────────────────────────────────
  wordChosen() {
    this._tone(440, 0.08, 0.3, "sine", 0);
    this._tone(660, 0.12, 0.3, "sine", 0.08);
  }
}

// Export a singleton — one instance shared across the whole app
export const sounds = new SoundManager();
