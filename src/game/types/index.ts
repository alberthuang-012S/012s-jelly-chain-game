export const NORMAL_SYMBOLS = ['pink', 'blue', 'green', 'purple', 'aqua'] as const;
export type NormalSymbol = (typeof NORMAL_SYMBOLS)[number];
export type SymbolId = NormalSymbol | 'fire' | 'wild' | 'bonus';
export type SpecialType = 'fire' | 'wild' | 'bonus' | null;
export interface Cell {
  id: string;
  symbol: SymbolId;
  specialType: SpecialType;
  state: 'settled';
}
export type Board = (Cell | null)[][];
export interface Position {
  row: number;
  col: number;
}
export interface Cluster {
  symbol: NormalSymbol;
  positions: Position[];
}
export interface Movement {
  id: string;
  from: Position;
  to: Position;
}
export type Phase =
  | 'idle'
  | 'starting'
  | 'spawning'
  | 'matching'
  | 'popping'
  | 'falling'
  | 'refilling'
  | 'resolving'
  | 'complete';
export type EventType =
  | 'ROUND_START'
  | 'SPAWN'
  | 'MATCH_FOUND'
  | 'SPECIAL_TRIGGER'
  | 'POP'
  | 'SPECIAL_CREATED'
  | 'GRAVITY'
  | 'REFILL'
  | 'CASCADE_COMPLETE'
  | 'ROUND_COMPLETE';
export interface GameEvent {
  type: EventType;
  phase: Phase;
  board: Board;
  cascade: number;
  score: number;
  scoreDelta: number;
  highlighted: string[];
  triggered: string[];
  movements: Movement[];
  created: string[];
  bonusCollected: number;
}
export interface RoundSummary {
  score: number;
  mockPoints: number;
  cascades: number;
  matches: number;
  maxCombo: number;
  bonusCollected: number;
  capped: boolean;
}
export interface RoundResult {
  version: 1;
  initialBoard: Board;
  finalBoard: Board;
  events: GameEvent[];
  summary: RoundSummary;
}
export const isNormal = (id: SymbolId): id is NormalSymbol =>
  (NORMAL_SYMBOLS as readonly string[]).includes(id);
