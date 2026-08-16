// Web Audio Synthesizer Engine for InstaWrapped
// 100% client-side, zero external audio asset dependencies, low latency.

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private ambientInterval: any = null;

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAmbient();
    } else {
      this.getContext();
      this.startAmbient();
      this.playChime(523.25); // C5 welcome chime
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Gentle chime
  public playChime(freq: number = 523.25) {
    if (this.isMuted) return;
    this.playTone(freq, 0.45, 'sine', 0.16);
    this.playTone(freq * 1.5, 0.35, 'triangle', 0.08, 0.04);
  }

  // Slide transition chime based on slide index (harmonic pentatonic scale)
  public playSlideTransition(slideIndex: number = 0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [
      261.63, // C4 (Intro)
      329.63, // E4 (Total)
      392.00, // G4 (Social Circle)
      440.00, // A4 (Top 1)
      523.25, // C5 (Top 5)
      587.33, // D5 (Calendar)
      659.25, // E5 (Peak)
      783.99, // G5 (Streak)
      880.00, // A5 (Monthly)
      987.77, // B5 (Reels Watched)
      1046.50 // C6 (Archetype)
    ];

    const freq = notes[slideIndex % notes.length];
    this.playTone(freq, 0.4, 'sine', 0.15);
    this.playTone(freq * 1.5, 0.35, 'triangle', 0.08, 0.04);
  }

  // Soft click for counters
  public playTick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      // AudioContext error guard
    }
  }

  // Celebratory sparkle arpeggio on final slide
  public playCelebrationFanfare() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const chord = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5]; // Cmaj9 arpeggio
    chord.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.isMuted) {
          this.playTone(freq, 0.8, 'sine', 0.18);
          this.playTone(freq * 2, 0.6, 'triangle', 0.06);
        }
      }, i * 110);
    });
  }

  // Helper to play a smooth synth tone
  private playTone(
    freq: number, 
    duration: number = 0.5, 
    type: OscillatorType = 'sine', 
    maxGain: number = 0.2, 
    delaySec: number = 0
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime + delaySec;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 3, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(maxGain, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Guard against audio exceptions
    }
  }

  // Subtle Lo-Fi Ambient Synthesizer Pad
  public startAmbient() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.stopAmbient();

    try {
      const chords = [
        [261.63, 329.63, 392.00, 493.88], // Cmaj7
        [220.00, 261.63, 329.63, 392.00], // Am7
        [174.61, 220.00, 261.63, 329.63], // Fmaj7
        [196.00, 246.94, 293.66, 392.00]  // G7
      ];

      let chordIdx = 0;

      const playChordPad = () => {
        if (this.isMuted || !this.ctx) return;
        const currentChord = chords[chordIdx % chords.length];
        chordIdx++;

        currentChord.forEach((freq) => {
          this.playPadNote(freq, 4.2, 0.035);
        });
      };

      playChordPad();
      this.ambientInterval = setInterval(playChordPad, 4000);
    } catch (e) {
      // Guard
    }
  }

  private playPadNote(freq: number, duration: number, maxVolume: number) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Lowpass warmth
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.linearRampToValueAtTime(900, now + duration * 0.5);
      filter.frequency.linearRampToValueAtTime(500, now + duration);

      // Soft envelope
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(maxVolume, now + 1.2);
      gain.gain.linearRampToValueAtTime(maxVolume * 0.7, now + duration - 1.2);
      gain.gain.linearRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Guard
    }
  }

  public stopAmbient() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();
