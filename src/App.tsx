import { useState } from 'react';
import { Board } from './components/Board';
import { BonusContent, HowToPlay, ResultContent } from './components/GameDialogs';
import { DebugPanel } from './components/DebugPanel';
import { Icon } from './components/Icon';
import { Modal } from './components/Modal';
import { RewardProgress, RewardShop } from './components/Rewards';
import { GAME_CONFIG as C } from './game/config';
import { comboLabel, comboMultiplier } from './game/scoring';
import { JELLY_SYMBOLS } from './game/symbols';
import { useGame } from './hooks/useGame';
type Overlay = 'help' | 'shop' | 'bonus' | null;
const phaseLabels = {
  idle: '準備好，讓好事發生。',
  starting: '正在啟動實驗…',
  spawning: 'Jelly 正在集合…',
  matching: '發現反應！',
  popping: 'POP！快樂正在連鎖。',
  falling: '新的相遇正在發生…',
  refilling: '補充一點 Jelly 能量。',
  resolving: '尋找下一個反應…',
  complete: '實驗完成，留下快樂的紀錄。',
};
export default function App() {
  const game = useGame(),
    { player, event, busy } = game;
  const [overlay, setOverlay] = useState<Overlay>(null);
  const debug = new URLSearchParams(window.location.search).get('debug') === '1';
  const close = () => {
    setOverlay(null);
    game.dismissResult();
  };
  const showShop = () => {
    game.dismissResult();
    setOverlay('shop');
  };
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="wordmark" href={window.location.pathname} aria-label="Jelly Lab 首頁">
          <span className="brand-symbol">
            <Icon name="flask" size={25} />
          </span>
          <span>
            JELLY LAB<small>CHAIN EXPERIMENT</small>
          </span>
        </a>
        <div className="header-right">
          <span className="edition">AN EXPERIMENT IN HAPPINESS</span>
          <button className="header-shop" aria-label="REWARD SHOP" onClick={showShop}>
            <Icon name="gift" size={18} />
            <span>REWARD SHOP</span>
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </header>
      <main className="lab-layout">
        <aside className="left-column">
          <div className="lab-intro">
            <span className="pill">
              <i className="live-dot" /> THE LAB IS OPEN
            </span>
            <h1>
              小小 Jelly，
              <br />
              大大<span>連鎖。</span>
            </h1>
            <p>
              一點好奇心，一群小可愛。
              <br />
              看看今天會發生什麼好事。
            </p>
            <div className="intro-specimen">
              <img src={JELLY_SYMBOLS.pink.asset} alt="帶著調色盤的粉紅 Jelly" />
              <span>
                MEET PALETTE<small>SPECIMEN NO. 01</small>
              </span>
            </div>
          </div>
          <section className="quick-guide">
            <div className="eyebrow">A LITTLE HOW-TO</div>
            <div className="mini-step">
              <span>01</span>
              <p>按下開始，Jelly 集合。</p>
            </div>
            <div className="mini-step">
              <span>02</span>
              <p>3 隻相連，自動 POP！</p>
            </div>
            <div className="mini-step">
              <span>03</span>
              <p>不停連鎖，放大快樂。</p>
            </div>
            <button className="text-button" onClick={() => setOverlay('help')}>
              完整玩法 <Icon name="arrow" size={15} />
            </button>
          </section>
        </aside>
        <section className="game-column" aria-label="Jelly Lab 遊戲">
          <div className="game-heading">
            <div>
              <span className="eyebrow">LET GOOD THINGS CONNECT</span>
              <h2>
                Chain experiment<span>連鎖實驗室</span>
              </h2>
            </div>
            <span className="experiment-number">
              EXP.<strong>{String(player.totalGames + (busy ? 1 : 0)).padStart(3, '0')}</strong>
            </span>
          </div>
          <div className="hud">
            <div className="hud-stat play-stat">
              <span>
                <i /> PLAY LEFT
              </span>
              <strong data-testid="plays">{player.plays.toString().padStart(2, '0')}</strong>
              <small>次實驗機會</small>
            </div>
            <div className="hud-stat score-stat">
              <span>SCORE</span>
              <strong key={event.score} data-testid="score">
                {event.score.toLocaleString()}
              </strong>
              <small>本局實驗分數</small>
            </div>
            <div className="hud-stat">
              <span>MOCK POINTS</span>
              <strong data-testid="points">{player.mockPoints.toLocaleString()}</strong>
              <small>累積體驗點數</small>
            </div>
          </div>
          <Board event={event} fast={player.fastMode} reducedMotion={game.reducedMotion} />
          <div className="reaction-status" role="status" aria-live="polite" aria-atomic="true">
            <span>
              <i className={`live-dot ${busy ? 'reacting' : ''}`} />
              {phaseLabels[event.phase]}
            </span>
            {event.cascade > 0 ? (
              <strong>
                {comboLabel(event.cascade)} <span>×{comboMultiplier(event.cascade)}</span>
              </strong>
            ) : (
              <span className="reaction-hint">3+ JELLIES = A LITTLE MAGIC</span>
            )}
          </div>
          <button
            className="primary-button start-button"
            onClick={() => void game.start()}
            disabled={busy || player.plays <= 0}
          >
            <Icon name="flask" size={22} />
            <span>
              {busy
                ? 'EXPERIMENT IN PROGRESS'
                : player.plays <= 0
                  ? 'NO PLAY LEFT'
                  : 'START EXPERIMENT'}
            </span>
            {!busy && player.plays > 0 && (
              <span className="play-cost">
                1 PLAY <Icon name="arrow" size={17} />
              </span>
            )}
          </button>
          {player.plays === 0 && !busy && (
            <p className="empty-play-message">
              今天的實驗機會已用完，謝謝你的好奇心。
              <br />
              這是本機體驗版，期待下一場相遇。
            </p>
          )}
          <div className="game-controls">
            <button onClick={game.toggleFast} aria-pressed={player.fastMode}>
              <Icon name="bolt" size={16} /> FAST MODE{' '}
              <i className={`toggle ${player.fastMode ? 'on' : ''}`} />
            </button>
            <button onClick={game.toggleSound} aria-pressed={player.soundEnabled}>
              <Icon name={player.soundEnabled ? 'sound' : 'mute'} size={17} /> SOUND{' '}
              {player.soundEnabled ? 'ON' : 'OFF'}
            </button>
            <button onClick={() => setOverlay('help')} aria-label="HOW TO PLAY · 遊戲玩法">
              <Icon name="help" size={17} />
              <span className="control-help-label">HOW TO PLAY</span>
            </button>
          </div>
          {busy && (
            <button className="skip-button" onClick={game.skip}>
              SKIP ANIMATION <Icon name="arrow" size={14} />
            </button>
          )}
          {game.error && (
            <p className="error-message" role="alert">
              {game.error}
            </p>
          )}
          {!game.persistent && (
            <p className="storage-note">此瀏覽器無法儲存進度，目前使用暫存模式。</p>
          )}
        </section>
        <aside className="right-column">
          <RewardProgress points={player.mockPoints} onOpen={showShop} />
          <button
            className={`bonus-card panel ${player.bonusProgress >= C.bonusTarget ? 'bonus-ready' : ''}`}
            onClick={() => setOverlay('bonus')}
          >
            <div>
              <div className="eyebrow">
                {player.bonusProgress >= C.bonusTarget ? 'BONUS READY' : 'A SECRET REACTION'}
              </div>
              <h3>Moonlight bonus</h3>
              <span className="bonus-dots">
                {Array.from({ length: C.bonusTarget }, (_, i) => (
                  <i key={i} className={i < player.bonusProgress ? 'filled' : ''} />
                ))}
                <small>
                  {player.bonusProgress}/{C.bonusTarget}
                </small>
              </span>
              <p>遇見月亮，收藏下一個驚喜。</p>
            </div>
            <img src={JELLY_SYMBOLS.bonus.asset} alt="月亮 Jelly" />
          </button>
          <div className="lab-record">
            <span className="eyebrow">YOUR LAB RECORD</span>
            <div>
              <span>最高實驗分數</span>
              <strong>{player.highestRoundScore.toLocaleString()}</strong>
            </div>
            <div>
              <span>最佳連鎖倍率</span>
              <strong>×{player.highestCombo}</strong>
            </div>
            <div>
              <span>累計完成實驗</span>
              <strong>{player.totalGames}</strong>
            </div>
          </div>
        </aside>
      </main>
      {debug && (
        <DebugPanel
          busy={busy}
          start={(scenario) => void game.start(scenario)}
          add={game.debugAdd}
          reset={game.debugReset}
        />
      )}
      <footer className="site-footer">
        <strong>
          2050 <span>×</span> 012S
        </strong>
        <span>A LITTLE JELLY. A LOT OF JOY.</span>
        <small>PHASE 1 · LOCAL MOCK EXPERIENCE</small>
      </footer>
      {(overlay || game.result) && (
        <Modal
          title={
            overlay === 'help'
              ? 'HOW TO PLAY'
              : overlay === 'shop'
                ? 'REWARD SHOP'
                : overlay === 'bonus'
                  ? 'BONUS MODE'
                  : 'EXPERIMENT COMPLETE'
          }
          onClose={close}
        >
          {overlay === 'help' ? (
            <HowToPlay />
          ) : overlay === 'shop' ? (
            <RewardShop points={player.mockPoints} />
          ) : overlay === 'bonus' ? (
            <BonusContent progress={player.bonusProgress} />
          ) : (
            game.result && (
              <ResultContent
                result={game.result}
                plays={player.plays}
                onAgain={() => {
                  game.dismissResult();
                  void game.start();
                }}
                onShop={showShop}
              />
            )
          )}
        </Modal>
      )}
    </div>
  );
}
