export type SoundEvent = 'start' | 'drop' | 'match' | 'pop' | 'combo' | 'fire' | 'bonus' | 'result';
const tones: Record<SoundEvent, number[]> = {
  start: [392, 523, 659],
  drop: [260],
  match: [523, 659],
  pop: [740, 988],
  combo: [659, 784, 988],
  fire: [130, 196, 260],
  bonus: [659, 880, 1318],
  result: [523, 659, 784, 1046],
};
export class AudioManager {
  private context?: AudioContext;
  enabled = false;
  async unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') await this.context.resume();
    } catch {
      /* Audio is optional; unsupported browsers keep playing silently. */
    }
  }
  play(event: SoundEvent, cascade = 1) {
    const context = this.context;
    if (!this.enabled || !context || context.state !== 'running') return;
    try {
      tones[event].forEach((tone, index) => {
        const oscillator = context.createOscillator(),
          gain = context.createGain();
        const time = context.currentTime + index * 0.07;
        oscillator.type = event === 'fire' ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(tone * (1 + Math.min(cascade - 1, 5) * 0.035), time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.045, time + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.23);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(time);
        oscillator.stop(time + 0.25);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
      });
    } catch {
      /* No rejected promises or interruption of the game. */
    }
  }
  dispose() {
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {});
  }
}
