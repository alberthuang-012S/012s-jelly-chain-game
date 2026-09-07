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
              : (config.animation[event.phase] ?? 0)),
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
