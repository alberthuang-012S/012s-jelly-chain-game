import { GAME_CONFIG as C } from '../game/config';
import type { RoundSummary } from '../game/types';
export const STORAGE_KEY = 'jelly_chain_game_v1';
export interface PlayerStats {
  plays: number;
  totalScore: number;
  mockPoints: number;
  highestRoundScore: number;
  highestCombo: number;
  totalGames: number;
  totalCascades: number;
  totalMatches: number;
  bonusProgress: number;
  soundEnabled: boolean;
  fastMode: boolean;
}
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export const defaultStats = (): PlayerStats => ({
  plays: C.initialPlays,
  totalScore: 0,
  mockPoints: 0,
  highestRoundScore: 0,
  highestCombo: 0,
  totalGames: 0,
  totalCascades: 0,
  totalMatches: 0,
  bonusProgress: 0,
  soundEnabled: false,
  fastMode: false,
});
export function parseStats(raw: string | null): PlayerStats {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (
      !value ||
      typeof value !== 'object' ||
      !('version' in value) ||
      value.version !== 1 ||
      !('stats' in value) ||
      !value.stats ||
      typeof value.stats !== 'object'
    )
      return defaultStats();
    const candidate = value.stats as Record<string, unknown>;
    const defaults = defaultStats();
    for (const [key, initial] of Object.entries(defaults)) {
      const v = candidate[key];
      if (
        typeof initial === 'boolean'
          ? typeof v !== 'boolean'
          : typeof v !== 'number' ||
            !Number.isFinite(v) ||
            v < 0 ||
            v > Number.MAX_SAFE_INTEGER ||
            (key !== 'highestCombo' && !Number.isInteger(v))
      )
        return defaultStats();
    }
    return Object.fromEntries(
      Object.keys(defaults).map((k) => [k, candidate[k]]),
    ) as unknown as PlayerStats;
  } catch {
    return defaultStats();
  }
}
export function browserStorage(): StoragePort | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
export class PlayerStore {
  private stats: PlayerStats;
  persistent = true;
  constructor(private storage?: StoragePort) {
    this.persistent = !!storage;
    try {
      this.stats = parseStats(storage?.getItem(STORAGE_KEY) ?? null);
    } catch {
      this.stats = defaultStats();
      this.persistent = false;
    }
  }
  read() {
    return { ...this.stats };
  }
  write(stats: PlayerStats) {
    this.stats = { ...stats };
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify({ version: 1, stats }));
    } catch {
      this.persistent = false;
    }
    return this.read();
  }
  reset() {
    return this.write(defaultStats());
  }
}
export function settleRound(stats: PlayerStats, result: RoundSummary): PlayerStats {
  if (stats.plays <= 0) throw new Error('NO PLAY LEFT');
  return {
    ...stats,
    plays: stats.plays - 1,
    totalScore: stats.totalScore + result.score,
    mockPoints: stats.mockPoints + result.mockPoints,
    highestRoundScore: Math.max(stats.highestRoundScore, result.score),
    highestCombo: Math.max(stats.highestCombo, result.maxCombo),
    totalGames: stats.totalGames + 1,
    totalCascades: stats.totalCascades + result.cascades,
    totalMatches: stats.totalMatches + result.matches,
    bonusProgress: Math.min(C.bonusTarget, stats.bonusProgress + result.bonusCollected),
  };
}
