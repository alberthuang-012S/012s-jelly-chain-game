import { describe, expect, it } from 'vitest';
import { LocalGameService } from '../game/services';
import { SeededRandom } from '../game/rng';
import { PlayerStore, STORAGE_KEY, defaultStats, parseStats, type StoragePort } from './index';
function memory(): StoragePort {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}
describe('versioned storage', () => {
  it.each([null, '{oops', '{}', 'null', '{"version":2,"stats":{}}', '{"version":1,"stats":null}'])(
    'invalid payload %s safely resets',
    (raw) => expect(parseStats(raw)).toEqual(defaultStats()),
  );
  it.each([-1, 1.5, '10', null])('invalid play count %s safely resets', (plays) =>
    expect(parseStats(JSON.stringify({ version: 1, stats: { ...defaultStats(), plays } }))).toEqual(
      defaultStats(),
    ),
  );
  it('reload preserves stats and settings', () => {
    const port = memory(),
      store = new PlayerStore(port);
    store.write({
      ...defaultStats(),
      plays: 4,
      mockPoints: 250,
      fastMode: true,
      soundEnabled: true,
    });
    expect(new PlayerStore(port).read()).toEqual(store.read());
  });
  it('unavailable or full storage falls back to memory', () => {
    const store = new PlayerStore({
      getItem: () => {
        throw new Error();
      },
      setItem: () => {
        throw new Error();
      },
    });
    expect(store.read()).toEqual(defaultStats());
    expect(() => store.write({ ...defaultStats(), plays: 2 })).not.toThrow();
    expect(store.read().plays).toBe(2);
    expect(store.persistent).toBe(false);
  });
  it('reset touches only this game key', () => {
    const port = memory();
    port.setItem('unrelated', 'keep');
    const store = new PlayerStore(port);
    store.reset();
    expect(port.getItem('unrelated')).toBe('keep');
    expect(port.getItem(STORAGE_KEY)).toBeTruthy();
  });
});
describe('local game service', () => {
  it('play decreases exactly once and a rapid second start is rejected', async () => {
    const service = new LocalGameService(new PlayerStore(memory()), new SeededRandom(1));
    const round = service.startRound();
    await expect(service.startRound()).rejects.toThrow('IN PROGRESS');
    await round;
    expect(service.readPlayer().plays).toBe(9);
    service.finishPlayback();
    await service.startRound();
    expect(service.readPlayer().plays).toBe(8);
  });
  it('zero plays cannot start or go negative', async () => {
    const store = new PlayerStore(memory());
    store.write({ ...defaultStats(), plays: 0 });
    const service = new LocalGameService(store);
    await expect(service.startRound()).rejects.toThrow('NO PLAY');
    expect(store.read().plays).toBe(0);
  });
  it('ten plays can be consumed and the eleventh is rejected', async () => {
    const service = new LocalGameService(new PlayerStore(memory()));
    for (let i = 0; i < 10; i++) {
      await service.startRound({ scenario: 'no-match' });
      service.finishPlayback();
    }
    await expect(service.startRound()).rejects.toThrow('NO PLAY');
    expect(service.readPlayer().plays).toBe(0);
  });
  it('settlement survives reload during animation without awarding again', async () => {
    const port = memory(),
      service = new LocalGameService(new PlayerStore(port), new SeededRandom(1));
    const { result, player } = await service.startRound();
    expect(player.mockPoints).toBe(result.summary.mockPoints);
    expect(player.totalScore).toBe(result.summary.score);
    expect(new LocalGameService(new PlayerStore(port)).readPlayer()).toEqual(player);
  });
  it('fast mode only changes presentation, not the event timeline', async () => {
    const a = new LocalGameService(new PlayerStore(memory()), new SeededRandom(7));
    const b = new LocalGameService(new PlayerStore(memory()), new SeededRandom(7));
    b.updateSettings({ fastMode: true });
    expect((await a.startRound()).result).toEqual((await b.startRound()).result);
  });
  it('rejects debug mutations during a round', async () => {
    const service = new LocalGameService(new PlayerStore(memory()));
    await service.startRound({ scenario: 'no-match' });
    expect(() => service.debugReset()).toThrow('Finish');
    expect(() => service.debugUpdate({ plays: 20 })).toThrow('Finish');
  });
  it('failed RNG does not consume a play and releases the lock', async () => {
    const service = new LocalGameService(new PlayerStore(memory()), { next: () => NaN });
    await expect(service.startRound()).rejects.toThrow('RNG');
    expect(service.readPlayer().plays).toBe(10);
    await expect(service.startRound({ scenario: 'no-match' })).resolves.toBeDefined();
  });
});
