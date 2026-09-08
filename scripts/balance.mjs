import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true },
  appType: 'custom',
});
try {
  const { runRound } = await server.ssrLoadModule('/src/game/engine/round.ts');
  const { SeededRandom } = await server.ssrLoadModule('/src/game/rng/index.ts');
  const { GAME_CONFIG: config } = await server.ssrLoadModule('/src/game/config/index.ts');
  const rounds = Array.from({ length: 1000 }, (_, seed) => runRound(new SeededRandom(seed)));
  const mean = (key) => rounds.reduce((sum, round) => sum + round.summary[key], 0) / rounds.length;
  const durations = rounds
    .map(
      (round) =>
        round.events.reduce(
          (sum, event) =>
            sum +
            (event.type === 'SPECIAL_CREATED'
              ? config.animation.matching
              : (config.animation[event.phase] ?? 0) +
                (['SPAWN', 'REFILL'].includes(event.type)
                  ? 5 * config.animation.columnStagger
                  : 0)),
          0,
        ) / 1000,
    )
    .sort((a, b) => a - b);
  console.log(
    JSON.stringify(
      {
        seeds: '0–999',
        rounds: rounds.length,
        zeroMatchRounds: rounds.filter((round) => !round.summary.matches).length,
        cappedRounds: rounds.filter((round) => round.summary.capped).length,
        averageCascades: mean('cascades'),
        averageScore: mean('score'),
        noMatchPercent: rounds.filter((r) => !r.summary.matches).length / 10,
        medianCascades: rounds.map((r) => r.summary.cascades).sort((a, b) => a - b)[499],
        highCascadePercent: rounds.filter((r) => r.summary.cascades >= 6).length / 10,
        scoreP50: rounds.map((r) => r.summary.score).sort((a, b) => a - b)[499],
        scoreP90: rounds.map((r) => r.summary.score).sort((a, b) => a - b)[899],
        fireTriggersPerRound:
          rounds.reduce(
            (n, r) =>
              n +
              r.events
                .filter((e) => e.type === 'SPECIAL_TRIGGER')
                .reduce((a, e) => a + e.triggered.length, 0),
            0,
          ) / 1000,
        bonusEncounterPercent: rounds.filter((r) => r.summary.bonusCollected > 0).length / 10,
        cappedPercent: rounds.filter((r) => r.summary.capped).length / 10,
        normalAnimationSeconds: {
          median: durations[500],
          p90: durations[900],
          max: durations.at(-1),
        },
      },
      null,
      2,
    ),
  );
} finally {
  await server.close();
}
