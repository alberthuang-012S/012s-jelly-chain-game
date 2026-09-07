import { GAME_CONFIG as C } from '../config';
import type { Board, Position } from '../types';
import { key, position } from './board';

// Iterative queue + instance ID set: each fire triggers at most once per stage.
export function expandFire(board: Board, initial: Position[]) {
  const cleared = new Set(initial.map(key)),
    triggered = new Set<string>();
  const queue = [...initial];
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i],
      cell = board[p.row]?.[p.col];
    if (cell?.symbol !== 'fire' || triggered.has(cell.id)) continue;
    triggered.add(cell.id);
    for (let row = Math.max(0, p.row - 1); row <= Math.min(C.rows - 1, p.row + 1); row++) {
      for (let col = Math.max(0, p.col - 1); col <= Math.min(C.columns - 1, p.col + 1); col++) {
        const q = { row, col };
        if (!board[row][col]) continue;
        if (!cleared.has(key(q))) {
          cleared.add(key(q));
          queue.push(q);
        }
      }
    }
  }
  return { cleared: [...cleared].sort((a, b) => a - b).map(position), triggered: [...triggered] };
}
