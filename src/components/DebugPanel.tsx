import { DEBUG_REWARDS, SCENARIOS, type Scenario } from '../game/debug';
export function DebugPanel({
  busy,
  start,
  add,
  reset,
}: {
  busy: boolean;
  start: (scenario: Scenario) => void;
  add: (kind: 'plays' | 'mockPoints', amount: number) => void;
  reset: () => void;
}) {
  return (
    <details className="debug-panel" open>
      <summary>LAB DEBUG · PHASE 1 MOCK ONLY</summary>
      <p>
        FORCE 會啟動一局固定情境，消耗 1 PLAY。快轉不改變結果。SCORE ÷ 100 向下取整僅供 MOCK POINTS
        使用。
      </p>
      <fieldset disabled={busy}>
        <legend className="sr-only">Debug controls</legend>
        <button onClick={() => add('plays', DEBUG_REWARDS.plays)}>+10 PLAY</button>
        <button onClick={() => add('mockPoints', DEBUG_REWARDS.mockPoints)}>
          +1000 MOCK POINTS
        </button>
        <button onClick={reset}>RESET LOCAL DATA</button>
        {SCENARIOS.map((scenario) => (
          <button key={scenario} onClick={() => start(scenario)}>
            FORCE {scenario.replaceAll('-', ' ').toUpperCase()}
          </button>
        ))}
      </fieldset>
    </details>
  );
}
