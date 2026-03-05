export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  tone(freq, duration = 0.08, type = 'sine', gain = 0.06) {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.value = gain;
    amp.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    osc.connect(amp).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  play(name) {
    const map = {
      draw: () => this.tone(500, 0.04, 'triangle', 0.04),
      complete: () => [660, 880, 1100].forEach((f, i) => setTimeout(() => this.tone(f, 0.1, 'sine', 0.07), i * 90)),
      upgrade: () => this.tone(740, 0.09, 'square', 0.07),
      prestige: () => [320, 420, 520].forEach((f, i) => setTimeout(() => this.tone(f, 0.14, 'sawtooth', 0.08), i * 120)),
      click: () => this.tone(420, 0.03, 'square', 0.03)
    };
    map[name]?.();
  }
}
