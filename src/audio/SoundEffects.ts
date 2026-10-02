class SoundEffectManager {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;
  // Kept separate from `muted` so un-muting after an ad never un-mutes a player-muted game.
  private adMuted: boolean = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || this.adMuted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /** Portal requirement: silence all audio while an ad is playing. */
  public setAdMuted(m: boolean) {
    this.adMuted = m;
  }

  // ---- Background music: bouncy C-major loop, no assets ----
  private musicTimer: number | null = null;
  private musicStep = 0;

  private blip(freq: number, dur: number, type: OscillatorType, vol: number, when = 0) {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  /** Idempotent. Call from a user gesture; AudioContext requires one. */
  public startMusic() {
    if (this.musicTimer !== null || typeof window === 'undefined') return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.musicStep = 0;
    this.musicTimer = window.setInterval(() => this.musicTick(), 150);
  }

  public stopMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private musicTick() {
    // Never schedule while muted, ad-muted, hidden, or suspended; tails fade.
    if (this.muted || this.adMuted || document.hidden || !this.ctx) return;
    if (this.ctx.state !== 'running') return;
    const s = this.musicStep++ % 32;
    // Bouncy bassline: C - G - A - F, two bars of eighth notes.
    const bass = [130.81, 130.81, 196.0, 196.0, 174.61, 174.61, 196.0, 196.0,
      130.81, 130.81, 196.0, 196.0, 174.61, 174.61, 146.83, 146.83];
    this.blip(bass[s % 16], 0.14, 'triangle', 0.055);
    // Sparse music-box lead on the off-beats, C major pentatonic.
    if (s % 4 === 2) {
      const lead = [523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33];
      this.blip(lead[(s >> 2) % 8], 0.22, 'sine', 0.045);
    }
    // Soft tick on every other step.
    if (s % 2 === 0) this.blip(6000, 0.03, 'sine', 0.006);
  }

  public playFlapLift() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Soft airy cloth whoosh + pitch rise
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.11);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playHoneyLanding() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Suction "Plop!"
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = 'triangle';
    popOsc.frequency.setValueAtTime(160, now);
    popOsc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
    popGain.gain.setValueAtTime(0.3, now);
    popGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
    popOsc.connect(popGain);
    popGain.connect(ctx.destination);
    popOsc.start(now);
    popOsc.stop(now + 0.09);

    // 2. Sparkling ascending major arpeggio (honey landing!)
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const startTime = now + 0.07 + idx * 0.055;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.29);
    });
  }

  public playNormalLanding() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Comical suction cup pop + cheerful two-tone
    const notes = [330, 440, 659.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.06;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.19);
    });
  }

  public playBounceHop(combo: number = 1) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Boing! Springy cartoon jump pitch scaled by combo
    const baseFreq = Math.min(520, 220 + combo * 22);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 0.7, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.18);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playGroundCrash() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Sad descending slide-whistle / trombone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.38);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.41);
  }

  public playShopPurchase() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Cash register Cha-Ching!
    const freqs = [987.77, 1318.51];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.08;
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  public playHelicopterChop() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(72, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.06);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playBossWindowOpen() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [587.33, 880];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const t = now + i * 0.07;
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }
}

export const soundFX = new SoundEffectManager();
