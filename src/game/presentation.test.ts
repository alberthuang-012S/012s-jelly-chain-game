import { expect, it } from 'vitest';
import { PlaybackGate, type Presentation } from './presentation';
import { runRound } from './engine/round';
import { SeededRandom } from './rng';
it('waits for rendering completion, rejects stale acknowledgements and permits cancellation', async () => {
  const gate = new PlaybackGate();
  const event = runRound(new SeededRandom(1)).events[0];
  let frame!: Presentation;
  let completed = false;
  const first = gate
    .show(event, 470, 1, false, (f) => {
      frame = f;
    })
    .then(() => {
      completed = true;
    });
  await Promise.resolve();
  expect(completed).toBe(false);
  expect(frame.factor).toBe(1);
  const stale = frame.done;
  frame.done();
  await first;
  completed = false;
  const second = gate
    .show(event, 250, 0.55, false, (f) => {
      frame = f;
    })
    .then(() => {
      completed = true;
    });
  stale();
  await Promise.resolve();
  expect(completed).toBe(false);
  expect(frame.factor).toBe(0.55);
  gate.cancel();
  await second;
  expect(completed).toBe(true);
});
