import { GAME_CONFIG as C } from '../config';
import type { RandomSource } from '../rng';
import {
  isNormal,
  type Board,
  type Cell,
  type Movement,
  type Position,
  type SymbolId,
} from '../types';
export const emptyBoard = (): Board =>
  Array.from({ length: C.rows }, () => Array<Cell | null>(C.columns).fill(null));
export const cloneBoard = (board: Board): Board =>
  board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
export const key = ({ row, col }: Position) => row * C.columns + col;
export const position = (key: number): Position => ({
  row: Math.floor(key / C.columns),
  col: key % C.columns,
});
export function neighbors({ row, col }: Position): Position[] {
  return [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ].filter((p) => p.row >= 0 && p.row < C.rows && p.col >= 0 && p.col < C.columns);
}
export function cellFactory(prefix = 'j') {
  let sequence = 0;
  return (symbol: SymbolId): Cell => ({
    id: `${prefix}-${sequence++}`,
    symbol,
    specialType: isNormal(symbol) ? null : symbol,
    state: 'settled',
  });
}
export function weightedSymbol(rng: RandomSource): SymbolId {
  const entries = Object.entries(C.spawnWeights).filter(
    ([id, weight]) =>
      weight > 0 && (!isNormal(id as SymbolId) || C.normalSymbols.some((symbol) => symbol === id)),
  ) as [SymbolId, number][];
  const value = rng.next();
  if (!Number.isFinite(value) || value < 0 || value >= 1)
    throw new Error('RNG must return a number in [0, 1).');
  let target = value * entries.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [symbol, weight] of entries) {
    target -= weight;
    if (target < 0) return symbol;
  }
  return entries[entries.length - 1][0];
}
export function refill(board: Board, rng: RandomSource, make: (symbol: SymbolId) => Cell) {
  const next = cloneBoard(board),
    movements: Movement[] = [];
  for (let col = 0; col < C.columns; col++) {
    const holes = next.filter((row) => !row[col]).length;
    let index = 0;
    for (let row = 0; row < C.rows; row++)
      if (!next[row][col]) {
        const cell = make(weightedSymbol(rng));
        next[row][col] = cell;
        movements.push({ id: cell.id, from: { row: -holes + index++, col }, to: { row, col } });
      }
  }
  return { board: next, movements };
}
export const generateBoard = (rng: RandomSource, make = cellFactory()) =>
  refill(emptyBoard(), rng, make).board;
export function gravity(board: Board) {
  const next = emptyBoard(),
    movements: Movement[] = [];
  for (let col = 0; col < C.columns; col++) {
    let target = C.rows - 1;
    for (let row = C.rows - 1; row >= 0; row--) {
      const cell = board[row][col];
      if (cell) {
        next[target][col] = { ...cell };
        if (row !== target)
          movements.push({ id: cell.id, from: { row, col }, to: { row: target, col } });
        target--;
      }
    }
  }
  return { board: next, movements };
}
export function validateBoard(board: Board) {
  if (board.length !== C.rows || board.some((row) => row.length !== C.columns))
    throw new Error('Board must be 6×6.');
  const ids = board
    .flat()
    .filter((cell): cell is Cell => !!cell)
    .map((cell) => cell.id);
  if (new Set(ids).size !== ids.length) throw new Error('Cell instance IDs must be unique.');
}
