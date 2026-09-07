export interface RandomSource {
  next(): number;
}
export class DefaultRandom implements RandomSource {
  next() {
    return Math.random();
  }
}
export class SeededRandom implements RandomSource {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0;
  }
  next() {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
