import { GAME_CONFIG as C } from '../config';
import type { RandomSource } from '../rng';
import { clusterScore, comboMultiplier, toMockPoints } from '../scoring';
import type { Board, Cell, GameEvent, Position, RoundResult } from '../types';
import {
  cellFactory,
  cloneBoard,
  generateBoard,
  gravity,
  key,
  refill,
  validateBoard,
} from './board';
import { findClusters } from './clusters';
import { expandFire } from './specials';

export function runRound(rng: RandomSource, initial?: Board): RoundResult {
  if (initial) validateBoard(initial);
  const prefix = initial ? 'round' : 'j';
  const makeRaw = cellFactory(prefix),
    occupied = new Set(
      initial
        ?.flat()
        .filter((c): c is Cell => !!c)
        .map((c) => c.id),
    );
  const make: typeof makeRaw = (symbol) => {
    let cell = makeRaw(symbol);
    while (occupied.has(cell.id)) cell = makeRaw(symbol);
    occupied.add(cell.id);
    return cell;
  };
  let board = initial ? cloneBoard(initial) : generateBoard(rng, make);
  if (!initial)
    for (let i = 0; i < C.maxInitialRerolls && !findClusters(board).length; i++)
      board = generateBoard(rng, make);
  const initialBoard = cloneBoard(board),
    events: GameEvent[] = [],
    seenBonus = new Set<string>();
  let score = 0,
    cascade = 0,
    matches = 0;
  const collectBonus = () => {
    for (const cell of board.flat()) if (cell?.symbol === 'bonus') seenBonus.add(cell.id);
  };
  const emit = (
    type: GameEvent['type'],
    phase: GameEvent['phase'],
    detail: Partial<GameEvent> = {},
  ) => {
    events.push({
      type,
      phase,
      board: cloneBoard(board),
      cascade,
      score,
      scoreDelta: 0,
      highlighted: [],
      triggered: [],
      movements: [],
      created: [],
      bonusCollected: seenBonus.size,
      ...detail,
    });
  };
  emit('ROUND_START', 'starting');
  collectBonus();
  emit('SPAWN', 'spawning');
  while (cascade < C.maxCascades) {
    const clusters = findClusters(board),
      fires: Position[] = [];
    board.forEach((row, r) =>
      row.forEach((cell, col) => {
        if (cell?.symbol === 'fire') fires.push({ row: r, col });
      }),
    );
    if (!clusters.length && !fires.length) break;
    cascade++;
    matches += clusters.length;
    const matchPositions = clusters.flatMap((c) => c.positions),
      matchKeys = new Set(matchPositions.map(key));
    const explosion = expandFire(board, [...matchPositions, ...fires]);
    const highlighted = explosion.cleared.flatMap((p) => board[p.row][p.col]?.id ?? []);
    const extraCells = explosion.cleared.filter(
      (p) => !matchKeys.has(key(p)) && board[p.row][p.col],
    ).length;
    const delta =
      clusters.reduce((sum, c) => sum + clusterScore(c.positions.length, cascade), 0) +
      Math.round(extraCells * C.explosionCellScore * comboMultiplier(cascade));
    emit('MATCH_FOUND', 'matching', { highlighted });
    if (explosion.triggered.length)
      emit('SPECIAL_TRIGGER', 'matching', { highlighted, triggered: explosion.triggered });
    score += delta;
    emit('POP', 'popping', { highlighted, triggered: explosion.triggered, scoreDelta: delta });
    const created: { position: Position; cell: Cell }[] = [];
    for (const cluster of clusters) {
      const size = cluster.positions.length;
      const symbol =
        size >= C.specialSpawn.wildMinClusterSize && rng.next() < C.specialSpawn.wildChance
          ? 'wild'
          : size === C.specialSpawn.fireClusterSize && rng.next() < C.specialSpawn.fireChance
            ? 'fire'
            : null;
      // Bottom-most, then left-most normal cell. New instance survives this stage's removal.
      if (symbol) {
        const candidates = cluster.positions
          .filter((p) => board[p.row][p.col]?.specialType === null)
          .sort((a, b) => b.row - a.row || a.col - b.col);
        if (candidates[0]) created.push({ position: candidates[0], cell: make(symbol) });
      }
    }
    board = cloneBoard(board);
    for (const p of explosion.cleared) board[p.row][p.col] = null;
    for (const { position: p, cell } of created) board[p.row][p.col] = cell;
    if (created.length)
      emit('SPECIAL_CREATED', 'resolving', { created: created.map((c) => c.cell.id) });
    const fallen = gravity(board);
    board = fallen.board;
    emit('GRAVITY', 'falling', { movements: fallen.movements });
    const filled = refill(board, rng, make);
    board = filled.board;
    collectBonus();
    emit('REFILL', 'refilling', { movements: filled.movements });
    emit('CASCADE_COMPLETE', 'resolving');
  }
  const capped =
    cascade === C.maxCascades &&
    (findClusters(board).length > 0 || board.flat().some((c) => c?.symbol === 'fire'));
  emit('ROUND_COMPLETE', 'complete');
  return {
    version: 1,
    initialBoard,
    finalBoard: cloneBoard(board),
    events,
    summary: {
      score,
      mockPoints: toMockPoints(score),
      cascades: cascade,
      matches,
      maxCombo: comboMultiplier(cascade),
      bonusCollected: seenBonus.size,
      capped,
    },
  };
}
