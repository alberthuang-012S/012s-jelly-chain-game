import { describe, expect, it } from 'vitest';
import { GAME_CONFIG as C } from '../config';
import { SCENARIOS, debugBoard, debugRandom } from '../debug';
import { SeededRandom } from '../rng';
import { baseScore, clusterScore, comboMultiplier, toMockPoints } from '../scoring';
import type { Board, SymbolId } from '../types';
import {
  cellFactory,
  emptyBoard,
  generateBoard,
  gravity,
  refill,
  validateBoard,
  weightedSymbol,
} from './board';
import { findClusters } from './clusters';
import { runRound } from './round';
import { expandFire } from './specials';
function fixture(points: [number, number, SymbolId][]) {
  const board = emptyBoard(),
    make = cellFactory('test');
  points.forEach(([r, c, symbol]) => {
    board[r][c] = make(symbol);
  });
  return board;
}
const pattern = (coords: number[][], symbol: SymbolId = 'pink') =>
  fixture(coords.map(([r, c]) => [r, c, symbol]));
describe('orthogonal cluster detection', () => {
  it.each([
    [
      'horizontal 3',
      [
        [0, 0],
        [0, 1],
        [0, 2],
      ],
    ],
    [
      'vertical 3',
      [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
    ],
    [
      'L shape',
      [
        [0, 0],
        [1, 0],
        [1, 1],
      ],
    ],
    [
      'four square',
      [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ],
    ],
    [
      'T shape',
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 1],
      ],
    ],
    [
      'bottom-right edge',
      [
        [5, 5],
        [5, 4],
        [4, 5],
      ],
    ],
  ])('%s matches as one component', (_, coordinates) => {
    const result = findClusters(pattern(coordinates as number[][]));
    expect(result).toHaveLength(1);
    expect(result[0].positions).toHaveLength(coordinates.length);
  });
  it('diagonal does not match', () =>
    expect(
      findClusters(
        pattern([
          [0, 0],
          [1, 1],
          [2, 2],
        ]),
      ),
    ).toEqual([]));
  it('two do not match', () =>
    expect(
      findClusters(
        pattern([
          [0, 0],
          [0, 1],
        ]),
      ),
    ).toEqual([]));
  it('all empty is safe', () => expect(findClusters(emptyBoard())).toEqual([]));
  it('two disconnected same-color components stay separate', () =>
    expect(
      findClusters(
        pattern([
          [0, 0],
          [0, 1],
          [0, 2],
          [5, 3],
          [5, 4],
          [5, 5],
        ]),
      ).map((c) => c.positions.length),
    ).toEqual([3, 3]));
  it('multiple colors match simultaneously', () =>
    expect(
      findClusters(
        fixture([
          [0, 0, 'pink'],
          [0, 1, 'pink'],
          [0, 2, 'pink'],
          [5, 0, 'blue'],
          [5, 1, 'blue'],
          [5, 2, 'blue'],
        ]),
      ),
    ).toHaveLength(2));
  it('36 cell cluster terminates', () =>
    expect(findClusters(generateBoard({ next: () => 0.01 }))[0].positions).toHaveLength(36));
  it('special symbols never match normally', () => {
    for (const special of ['fire', 'wild', 'bonus'] as const)
      expect(
        findClusters(
          pattern(
            [
              [0, 0],
              [0, 1],
              [0, 2],
            ],
            special,
          ),
        ),
      ).toEqual([]);
  });
});
describe('wild ownership', () => {
  it('wild completes a pair', () =>
    expect(
      findClusters(
        fixture([
          [0, 0, 'pink'],
          [0, 1, 'pink'],
          [0, 2, 'wild'],
        ]),
      )[0].positions,
    ).toHaveLength(3));
  it('largest original component wins', () => {
    const board = fixture([
      [1, 1, 'wild'],
      [1, 0, 'pink'],
      [0, 0, 'pink'],
      [1, 2, 'blue'],
      [1, 3, 'blue'],
      [1, 4, 'blue'],
    ]);
    expect(findClusters(board)).toMatchObject([
      { symbol: 'blue', positions: expect.arrayContaining([{ row: 1, col: 1 }]) },
    ]);
  });
  it('ties use fixed symbol priority', () => {
    const board = fixture([
      [1, 1, 'wild'],
      [1, 0, 'pink'],
      [0, 0, 'pink'],
      [1, 2, 'blue'],
      [1, 3, 'blue'],
    ]);
    expect(findClusters(board).map((c) => c.symbol)).toEqual(['pink']);
  });
  it('same-color size ties use row-major component priority', () => {
    const board = fixture([
      [1, 1, 'wild'],
      [1, 0, 'pink'],
      [0, 0, 'pink'],
      [1, 2, 'pink'],
      [1, 3, 'pink'],
    ]);
    expect(findClusters(board)[0].positions).toContainEqual({ row: 0, col: 0 });
    expect(findClusters(board)[0].positions).not.toContainEqual({ row: 1, col: 3 });
  });
  it('wild chains cannot propagate ownership', () => {
    expect(
      findClusters(
        fixture([
          [0, 0, 'pink'],
          [0, 1, 'wild'],
          [0, 2, 'wild'],
        ]),
      ),
    ).toEqual([]);
  });
  it('many wilds terminate without duplicate membership', () => {
    const board = generateBoard({ next: () => 0.01 });
    const make = cellFactory('wild');
    board.forEach((row, r) =>
      row.forEach((_, c) => {
        if ((r + c) % 2) board[r][c] = make('wild');
      }),
    );
    const ids = findClusters(board).flatMap((c) => c.positions.map((p) => board[p.row][p.col]!.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
describe('gravity and refill', () => {
  it('compacts multiple holes preserving order and instance IDs', () => {
    const board = fixture([
        [0, 0, 'pink'],
        [2, 0, 'blue'],
        [4, 0, 'green'],
      ]),
      before = structuredClone(board);
    const result = gravity(board);
    expect(result.board.map((row) => row[0]?.symbol ?? null)).toEqual([
      null,
      null,
      null,
      'pink',
      'blue',
      'green',
    ]);
    expect(result.board[3][0]!.id).toBe(board[0][0]!.id);
    expect(result.movements).toHaveLength(3);
    expect(board).toEqual(before);
  });
  it('empty column stays empty', () => expect(gravity(emptyBoard()).board).toEqual(emptyBoard()));
  it('full board has no movements', () =>
    expect(gravity(debugBoard('no-match')).movements).toEqual([]));
  it('refills only empty slots with unique new IDs', () => {
    const board = fixture([[5, 0, 'fire']]),
      result = refill(board, new SeededRandom(12), cellFactory('refill'));
    expect(result.board.flat().filter(Boolean)).toHaveLength(36);
    expect(result.movements).toHaveLength(35);
    expect(result.board[5][0]).toEqual(board[5][0]);
    expect(new Set(result.board.flat().map((c) => c!.id)).size).toBe(36);
    expect(result.movements.every((m) => m.from.row < 0)).toBe(true);
  });
  it('rejects malformed dimensions and duplicate IDs', () => {
    expect(() => validateBoard([])).toThrow('6×6');
    const board = debugBoard('no-match');
    board[0][1] = board[0][0];
    expect(() => validateBoard(board)).toThrow('unique');
  });
});
describe('score config', () => {
  it.each([
    [2, 0],
    [3, 30],
    [4, 60],
    [5, 120],
    [6, 200],
    [7, 300],
    [8, 400],
    [9, 500],
    [10, 600],
    [36, 3200],
  ])('size %i scores %i', (size, score) => expect(baseScore(size)).toBe(score));
  it.each([
    [0, 0],
    [1, 1],
    [2, 1.2],
    [3, 1.5],
    [4, 2],
    [5, 3],
    [6, 5],
    [20, 5],
  ])('cascade %i multiplies by %s', (stage, multiplier) =>
    expect(comboMultiplier(stage)).toBe(multiplier),
  );
  it('scores a simultaneous stage and rounds', () =>
    expect([4, 3, 5].reduce((sum, n) => sum + clusterScore(n, 3), 0)).toBe(315));
  it('mock points floor instead of rounding', () => expect(toMockPoints(4899)).toBe(48));
});
describe('fire', () => {
  it('clears a 3×3 region', () => {
    const board = debugBoard('no-match');
    board[2][2] = cellFactory('fire')('fire');
    expect(expandFire(board, [{ row: 2, col: 2 }]).cleared).toHaveLength(9);
  });
  it.each([
    [0, 0, 4],
    [0, 5, 4],
    [5, 0, 4],
    [5, 5, 4],
    [0, 2, 6],
  ])('clamps boundary %i %i', (row, col, size) => {
    const board = debugBoard('no-match');
    board[row][col] = cellFactory('f')('fire');
    expect(expandFire(board, [{ row, col }]).cleared).toHaveLength(size);
  });
  it('chain reaction triggers each instance once despite duplicate initial entries', () => {
    const board = debugBoard('fire');
    const result = expandFire(board, [
      { row: 2, col: 2 },
      { row: 2, col: 2 },
    ]);
    expect(result.triggered).toHaveLength(2);
    expect(new Set(result.triggered).size).toBe(2);
    expect(result.cleared).toHaveLength(14);
  });
  it('empty neighbors are safe and wilds do not chain explode', () => {
    const result = expandFire(
      fixture([
        [0, 0, 'fire'],
        [1, 1, 'wild'],
      ]),
      [{ row: 0, col: 0 }],
    );
    expect(result.cleared).toHaveLength(2);
    expect(result.triggered).toHaveLength(1);
  });
  it('new fire survives creation and triggers at the next stage', () => {
    const board = pattern([
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ]);
    const result = runRound({ next: () => 0.01 }, board);
    const creation = result.events.find((e) => e.type === 'SPECIAL_CREATED')!;
    const id = creation.created[0];
    expect(creation.board.flat().find((c) => c?.id === id)?.symbol).toBe('fire');
    expect(result.events.find((e) => e.triggered.includes(id))?.cascade).toBe(2);
  });
});
describe('deterministic round timeline', () => {
  it('same seed gives identical entire result', () =>
    expect(runRound(new SeededRandom(12))).toEqual(runRound(new SeededRandom(12))));
  it('different seeds give different boards', () =>
    expect(generateBoard(new SeededRandom(12))).not.toEqual(generateBoard(new SeededRandom(13))));
  it('seeded RNG is in range and repeats', () => {
    const a = new SeededRandom(0),
      b = new SeededRandom(0);
    for (let i = 0; i < 1000; i++) {
      const n = a.next();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
      expect(n).toBe(b.next());
    }
  });
  it('invalid RNG fails clearly', () =>
    expect(() => weightedSymbol({ next: () => NaN })).toThrow('RNG'));
  it('max cascades bounds a repeating RNG', () => {
    const result = runRound(debugRandom('high-combo'), debugBoard('high-combo'));
    expect(result.summary.cascades).toBe(C.maxCascades);
    expect(result.summary.capped).toBe(true);
    expect(result.events.at(-1)?.type).toBe('ROUND_COMPLETE');
  });
  it('no match yields a valid zero-score result without rerolling a debug board', () => {
    const result = runRound(new SeededRandom(1), debugBoard('no-match'));
    expect(result.summary).toMatchObject({ score: 0, maxCombo: 0, cascades: 0, matches: 0 });
  });
  it('total score equals pop deltas, input stays immutable and snapshots are independent', () => {
    const board = debugBoard('large-cluster'),
      before = structuredClone(board),
      result = runRound(new SeededRandom(123), board);
    expect(result.summary.score).toBe(result.events.reduce((sum, e) => sum + e.scoreDelta, 0));
    expect(board).toEqual(before);
    expect(result.events[0].board).not.toBe(result.events[1].board);
  });
  it('bonus is counted once per unique appearance', () => {
    expect(runRound(new SeededRandom(1), debugBoard('bonus')).summary.bonusCollected).toBe(3);
  });
  it('multiple clusters share the same cascade', () => {
    const board = fixture([
      [0, 0, 'pink'],
      [0, 1, 'pink'],
      [0, 2, 'pink'],
      [5, 0, 'blue'],
      [5, 1, 'blue'],
      [5, 2, 'blue'],
    ]);
    const result = runRound(new SeededRandom(1), board);
    expect(result.events.find((e) => e.type === 'POP')).toMatchObject({
      cascade: 1,
      scoreDelta: 60,
    });
  });
  it.each(SCENARIOS)('debug %s reproduces its full timeline', (scenario) =>
    expect(runRound(debugRandom(scenario), debugBoard(scenario))).toEqual(
      runRound(debugRandom(scenario), debugBoard(scenario)),
    ),
  );
  it('100 seeded rounds preserve filled boards, unique IDs, valid score and termination', () => {
    for (let seed = 0; seed < 100; seed++) {
      const round = runRound(new SeededRandom(seed));
      expect(round.summary.cascades).toBeLessThanOrEqual(C.maxCascades);
      expect(round.summary.score).toBeGreaterThanOrEqual(0);
      expect(round.finalBoard.flat().filter(Boolean)).toHaveLength(36);
      validateBoard(round.finalBoard as Board);
      if (!round.summary.capped) expect(findClusters(round.finalBoard)).toEqual([]);
    }
  });
});
