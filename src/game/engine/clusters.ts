import { GAME_CONFIG as C } from '../config';
import { isNormal, type Board, type Cluster, type Position } from '../types';
import { key, neighbors, position } from './board';

// First find normal-only components. Each wild attaches directly to exactly one
// original component. Assignments never propagate through other wilds.
export function findClusters(board: Board): Cluster[] {
  const components: Cluster[] = [],
    owner = new Map<number, number>();
  for (let row = 0; row < C.rows; row++)
    for (let col = 0; col < C.columns; col++) {
      const cell = board[row][col],
        origin = { row, col };
      if (!cell || !isNormal(cell.symbol) || owner.has(key(origin))) continue;
      const component: Cluster = { symbol: cell.symbol, positions: [] },
        queue: Position[] = [origin];
      owner.set(key(origin), components.length);
      for (let i = 0; i < queue.length; i++) {
        const current = queue[i];
        component.positions.push(current);
        for (const p of neighbors(current))
          if (!owner.has(key(p)) && board[p.row][p.col]?.symbol === cell.symbol) {
            owner.set(key(p), components.length);
            queue.push(p);
          }
      }
      components.push(component);
    }
  const sizes = components.map((c) => c.positions.length);
  for (let k = 0; k < C.rows * C.columns; k++) {
    const p = position(k);
    if (board[p.row][p.col]?.symbol !== 'wild') continue;
    const adjacent = [
      ...new Set(
        neighbors(p)
          .map((n) => owner.get(key(n)))
          .filter((n): n is number => n !== undefined),
      ),
    ];
    adjacent.sort(
      (a, b) =>
        sizes[b] - sizes[a] ||
        C.normalSymbols.indexOf(components[a].symbol) -
          C.normalSymbols.indexOf(components[b].symbol) ||
        a - b,
    );
    if (adjacent.length) components[adjacent[0]].positions.push(p);
  }
  return components.filter((c) => c.positions.length >= C.minClusterSize);
}
