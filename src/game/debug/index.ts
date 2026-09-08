import { GAME_CONFIG as C } from '../config';
import { cellFactory, emptyBoard } from '../engine/board';
import { SeededRandom, type RandomSource } from '../rng';
import { NORMAL_SYMBOLS, type Board, type SymbolId } from '../types';
export const SCENARIOS = [
  'high-combo',
  'fire',
  'yellow-cluster',
  'bonus',
  'no-match',
  'large-cluster',
] as const;
export type Scenario = (typeof SCENARIOS)[number];
export function debugBoard(scenario: Scenario): Board {
  const make = cellFactory('debug');
  const board = emptyBoard().map((row, r) =>
    row.map((_, c) => make(NORMAL_SYMBOLS[(r + c) % NORMAL_SYMBOLS.length])),
  );
  const put = (r: number, c: number, s: SymbolId) => {
    board[r][c] = make(s);
  };
  if (scenario === 'fire') {
    put(2, 2, 'fire');
    put(3, 3, 'fire');
  }
  if (scenario === 'yellow-cluster') {
    put(0, 0, 'yellow');
    put(0, 1, 'yellow');
    put(0, 2, 'yellow');
  }
  if (scenario === 'bonus') {
    put(0, 0, 'bonus');
    put(2, 2, 'bonus');
    put(5, 5, 'bonus');
  }
  if (scenario === 'large-cluster' || scenario === 'high-combo')
    for (let r = 1; r < 5; r++) for (let c = 1; c < 5; c++) put(r, c, 'pink');
  return board;
}
export function debugRandom(scenario: Scenario): RandomSource {
  if (scenario !== 'high-combo') return new SeededRandom(2050012);
  // Bounded, deliberately repetitive refill forces the cascade cap in a testable way.
  return { next: () => 0.01 };
}
export const previewBoard = () => debugBoard('no-match');
export const DEBUG_REWARDS = { plays: C.initialPlays, mockPoints: 1000 };
