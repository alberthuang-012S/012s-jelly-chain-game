import { GAME_CONFIG as C } from '../game/config';
import { JELLY_SYMBOLS } from '../game/symbols';
import type { RoundSummary } from '../game/types';
import { Icon } from './Icon';
export function ResultContent({
  result,
  plays,
  onAgain,
  onShop,
}: {
  result: RoundSummary;
  plays: number;
  onAgain: () => void;
  onShop: () => void;
}) {
  return (
    <div className="result-content">
      <div className="result-art">
        <span />
        <img
          src={JELLY_SYMBOLS[result.cascades >= 5 ? 'wild' : 'pink'].asset}
          alt="實驗完成 Jelly"
        />
      </div>
      <div className="eyebrow">EXPERIMENT COMPLETE</div>
      <h2>
        {result.cascades === 0
          ? 'Small reaction.'
          : result.cascades >= 6
            ? 'Hello, lab fever!'
            : 'A lovely chain reaction.'}
      </h2>
      <p>
        {result.cascades === 0
          ? 'No chain this time. 下一次相遇，也許就有新發現。'
          : '每一次相遇，都讓快樂多一點。'}
      </p>
      <div className="result-score">
        <span>ROUND SCORE</span>
        <strong>{result.score.toLocaleString()}</strong>
      </div>
      <div className="result-metrics">
        <div>
          <span>MAX COMBO</span>
          <strong>×{result.maxCombo}</strong>
        </div>
        <div>
          <span>CASCADES</span>
          <strong>{result.cascades}</strong>
        </div>
        <div>
          <span>MATCHES</span>
          <strong>{result.matches}</strong>
        </div>
      </div>
      <div className="points-earned">
        <span>
          <Icon name="star" /> MOCK POINTS
        </span>
        <strong>+{result.mockPoints.toLocaleString()}</strong>
      </div>
      <small className="mock-label">PHASE 1 MOCK ONLY · 本機體驗點數</small>
      {result.capped && (
        <p className="cap-note">本次反應已達 {C.maxCascades} 次安全上限，實驗順利結束。</p>
      )}
      <button className="primary-button" onClick={onAgain} disabled={plays <= 0}>
        {plays > 0 ? 'PLAY AGAIN' : 'NO PLAY LEFT'}
        <Icon name="arrow" />
      </button>
      <button className="text-button" onClick={onShop}>
        REWARD SHOP <Icon name="gift" size={16} />
      </button>
    </div>
  );
}
export function HowToPlay() {
  return (
    <>
      <span className="pill">THE LITTLE LAB GUIDE</span>
      <h2>
        Let good things connect.<span>按一下，讓 Jelly 自己產生反應。</span>
      </h2>
      <ol className="how-steps">
        <li>
          <strong>啟動實驗</strong>
          <p>每局消耗 1 PLAY，36 隻 Jelly 掉入培養槽。無需交換或拖曳。</p>
        </li>
        <li>
          <strong>相遇、消除、再連鎖</strong>
          <p>3 隻以上相同 Jelly 上下左右相連就會消除；斜角不算。補入的新 Jelly 可以繼續連鎖。</p>
        </li>
        <li>
          <strong>讓 Combo 越來越大</strong>
          <p>連鎖倍率依序為 ×1、×1.2、×1.5、×2、×3，6 次以上 ×5。</p>
        </li>
      </ol>
      <div className="guide-symbols">
        {(['fire', 'wild', 'bonus'] as const).map((id) => (
          <div key={id}>
            <img src={JELLY_SYMBOLS[id].asset} alt={JELLY_SYMBOLS[id].displayName} />
            <div>
              <strong>{id.toUpperCase()} JELLY</strong>
              <p>{JELLY_SYMBOLS[id].description}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="guide-note">
        5 隻群組有 30% 機率生成 FIRE；6 隻以上有 20% 機率生成 WILD。WILD
        選相鄰最大普通群組，同大小依粉紅 → 藍 → 綠 → 紫 → 水藍決定；不透過其他 WILD 連接。
      </p>
      <p className="guide-note">
        3／4／5／6／7 隻基本分數為 30／60／120／200／300，之後每多一隻 +100。FIRE 額外清除的每格為
        10 分，再乘連鎖倍率。
      </p>
      <p className="guide-note">
        PHASE 1 MOCK ONLY：每局 SCORE ÷ 100 無條件捨去換成 MOCK POINTS。PLAY、POINTS
        與獎勵都是本機體驗資料。
      </p>
    </>
  );
}
export function BonusContent({ progress }: { progress: number }) {
  return (
    <div className="bonus-content">
      <img src={JELLY_SYMBOLS.bonus.asset} alt="月亮 BONUS Jelly" />
      <span className="pill">
        {progress >= C.bonusTarget ? 'BONUS READY' : `${progress} / ${C.bonusTarget} BONUS`}
      </span>
      <h2>
        BONUS MODE<span>Coming in Phase 2</span>
      </h2>
      <p>
        月亮 Jelly 正在準備下一場驚喜。
        <br />
        累積遇見 3 隻，即可點亮 BONUS READY。
      </p>
      <p className="guide-note">Phase 1 僅提供模式預覽，沒有額外遊玩次數或真實獎勵。</p>
    </div>
  );
}
