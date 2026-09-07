import { useState } from 'react';
import { JELLY_SYMBOLS } from '../game/symbols';
import { Icon } from './Icon';
export const REWARDS = [
  { name: '$50 優惠券', points: 500, symbol: 'pink' },
  { name: '$100 優惠券', points: 1000, symbol: 'aqua' },
  { name: '$200 優惠券', points: 2000, symbol: 'purple' },
  { name: 'Jelly Gift', points: 3000, symbol: 'green' },
  { name: 'Limited Jelly', points: 5000, symbol: 'wild' },
] as const;
export function RewardProgress({ points, onOpen }: { points: number; onOpen: () => void }) {
  const next = REWARDS.find((reward) => reward.points > points) ?? REWARDS.at(-1)!;
  return (
    <section className="reward-card panel">
      <div className="eyebrow">
        <Icon name="gift" size={16} /> NEXT REWARD
      </div>
      <div className="reward-visual">
        <span className="orbit orbit-one" />
        <span className="orbit orbit-two" />
        <img src={JELLY_SYMBOLS.wild.asset} alt="皇冠 Jelly" />
        <span className="reward-sticker">
          A LITTLE
          <br />
          HAPPINESS
        </span>
      </div>
      <h3>{next.name}</h3>
      <p>每一場小實驗，都離驚喜近一點。</p>
      <div className="progress-label">
        <strong>{points.toLocaleString()}</strong>
        <span>/ {next.points.toLocaleString()} POINTS</span>
      </div>
      <progress
        value={Math.min(points, next.points)}
        max={next.points}
        aria-label="下一個獎勵進度"
      />
      <div className="reward-remaining">
        {Math.max(0, next.points - points).toLocaleString()} POINTS TO NEXT REWARD
      </div>
      <button className="text-button" onClick={onOpen}>
        探索獎勵 <Icon name="arrow" size={16} />
      </button>
    </section>
  );
}
export function RewardShop({ points }: { points: number }) {
  const [selected, setSelected] = useState('');
  return (
    <>
      <span className="pill">PHASE 1 PREVIEW</span>
      <h2>
        Reward shop<span>收集快樂，期待驚喜。</span>
      </h2>
      <p className="modal-description">
        你的 MOCK POINTS <strong>{points.toLocaleString()}</strong> · 預覽不扣點
      </p>
      <div className="shop-list">
        {REWARDS.map((reward) => (
          <div className="shop-item" key={reward.name}>
            <img src={JELLY_SYMBOLS[reward.symbol].asset} alt="" />
            <div>
              <h3>{reward.name}</h3>
              <p>{reward.points.toLocaleString()} POINTS</p>
              <span>
                {points >= reward.points ? 'Available · 可預覽' : 'Locked · Not Enough Points'}
              </span>
            </div>
            <button
              className="secondary-button small"
              onClick={() => setSelected(reward.name)}
              aria-label={`REDEEM ${reward.name}`}
            >
              {points >= reward.points ? 'REDEEM' : '預覽'}
              <Icon name={points >= reward.points ? 'arrow' : 'lock'} size={14} />
            </button>
          </div>
        ))}
      </div>
      {selected && (
        <div className="preview-note" role="status">
          <strong>{selected} · PHASE 1 PREVIEW</strong>
          <p>
            Reward redemption will be connected to the 2050 × 012S Activity Platform in a later
            phase.
          </p>
          <p>此為預覽，沒有扣除點數或發出獎勵。</p>
        </div>
      )}
    </>
  );
}
