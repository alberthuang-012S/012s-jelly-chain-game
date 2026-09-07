import { debugBoard, debugRandom, type Scenario } from '../debug';
import { runRound } from '../engine/round';
import { DefaultRandom, type RandomSource } from '../rng';
import type { RoundResult } from '../types';
import { PlayerStore, settleRound, type PlayerStats } from '../../storage';
export interface RoundRequest {
  scenario?: Scenario;
}
export interface RoundReceipt {
  result: RoundResult;
  player: PlayerStats;
}
export interface GameService {
  startRound(request?: RoundRequest): Promise<RoundReceipt>;
  finishPlayback(): void;
  readPlayer(): PlayerStats;
  updateSettings(settings: Partial<Pick<PlayerStats, 'soundEnabled' | 'fastMode'>>): PlayerStats;
}
// Phase 2 replaces this adapter with a server-authoritative implementation of
// GameService. The presentation layer continues to consume the same event timeline.
export class LocalGameService implements GameService {
  private busy = false;
  constructor(
    readonly store: PlayerStore,
    private rng: RandomSource = new DefaultRandom(),
  ) {}
  readPlayer() {
    return this.store.read();
  }
  async startRound(request: RoundRequest = {}): Promise<RoundReceipt> {
    if (this.busy) throw new Error('EXPERIMENT IN PROGRESS');
    const player = this.store.read();
    if (player.plays <= 0) throw new Error('NO PLAY LEFT');
    this.busy = true;
    try {
      const result = request.scenario
        ? runRound(debugRandom(request.scenario), debugBoard(request.scenario))
        : runRound(this.rng);
      // One local checkpoint holds both the consumed play and the settled award.
      // Reloading during presentation cannot lose or award the same result twice.
      return { result, player: this.store.write(settleRound(player, result.summary)) };
    } catch (error) {
      this.busy = false;
      throw error;
    }
  }
  finishPlayback() {
    this.busy = false;
  }
  updateSettings(settings: Partial<Pick<PlayerStats, 'soundEnabled' | 'fastMode'>>) {
    return this.store.write({ ...this.store.read(), ...settings });
  }
  debugUpdate(patch: Partial<PlayerStats>) {
    if (this.busy) throw new Error('Finish the current experiment first.');
    return this.store.write({ ...this.store.read(), ...patch });
  }
  debugReset() {
    if (this.busy) throw new Error('Finish the current experiment first.');
    return this.store.reset();
  }
}
