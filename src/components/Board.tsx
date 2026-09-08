import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { GAME_CONFIG as C } from '../game/config';
import { comboLabel, comboMultiplier } from '../game/scoring';
import { JELLY_SYMBOLS } from '../game/symbols';
import type { Presentation } from '../game/presentation';
import type { GameEvent } from '../game/types';
export function Board({ event, frame }: { event: GameEvent; frame: Presentation | null }) {
  const container = useRef<HTMLDivElement>(null);
  const active = new Set(event.highlighted),
    created = new Set(event.created),
    triggered = new Set(event.triggered);
  const factor = frame?.factor ?? 1;
  useLayoutEffect(() => {
    const root = container.current;
    if (!root || !frame) return;
    let disposed = false;
    const animations: Animation[] = [];
    const moves = new Map(event.movements.map((move) => [move.id, move]));
    for (const element of root.querySelectorAll<HTMLElement>('.jelly-position')) {
      const move = moves.get(element.dataset.cellId!);
      if (!move) continue;
      const start = (move.from.row - move.to.row) * 100;
      const delay =
        frame.reduced || event.type === 'GRAVITY'
          ? 0
          : move.to.col * C.animation.columnStagger * factor;
      const keyframes = frame.reduced
        ? [{ transform: 'translate3d(0,' + start + '%,0)' }, { transform: 'translate3d(0,0,0)' }]
        : [
            { transform: 'translate3d(0,' + start + '%,0)', easing: 'cubic-bezier(.35,0,.8,.65)' },
            {
              transform: 'translate3d(0,' + C.animation.landingOvershoot * 100 + '%,0)',
              offset: 0.88,
            },
            { transform: 'translate3d(0,0,0)' },
          ];
      animations.push(
        element.animate(keyframes, { duration: frame.duration, delay, fill: 'both' }),
      );
    }
    let timer: number;
    const hold = new Promise<void>((resolve) => {
      timer = window.setTimeout(resolve, frame.duration);
    });
    void Promise.all([
      hold,
      ...animations.map((animation) => animation.finished.catch(() => undefined)),
    ]).then(() => {
      if (!disposed) {
        animations.forEach((animation) => animation.cancel());
        frame.done();
      }
    });
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      animations.forEach((animation) => animation.cancel());
    };
  }, [event, frame, factor]);
  return (
    <div
      className={`chamber ${event.phase === 'popping' && event.cascade >= 5 ? 'fever-pulse' : ''}`}
      style={{ '--speed': factor } as CSSProperties}
    >
      <div className="chamber-top">
        <span>
          <i className="live-dot" /> RESEARCH CHAMBER
        </span>
        <span>06 × 06</span>
      </div>
      <div className="board-wrap">
        <div className="board-grid" role="grid" aria-label="6 × 6 Jelly 培養槽，共 36 格">
          {Array.from({ length: C.rows }, (_, row) => (
            <div role="row" className="board-row" key={row}>
              {Array.from({ length: C.columns }, (_, col) => (
                <div
                  role="gridcell"
                  key={col}
                  className="board-cell"
                  aria-label={`第 ${row + 1} 列第 ${col + 1} 欄：${event.board[row][col] ? JELLY_SYMBOLS[event.board[row][col]!.symbol].displayName : '空格'}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div
          ref={container}
          className={`jellies phase-${event.phase}`}
          style={{ visibility: event.phase === 'starting' ? 'hidden' : 'visible' }}
          aria-hidden="true"
        >
          {event.board.flatMap((row, r) =>
            row.map((cell, c) => {
              if (!cell) return null;
              const symbol = JELLY_SYMBOLS[cell.symbol];
              return (
                <div
                  key={cell.id}
                  data-cell-id={cell.id}
                  className="jelly-position"
                  style={
                    {
                      top: `${(r / C.rows) * 100}%`,
                      left: `${(c / C.columns) * 100}%`,
                      '--column': c,
                      '--row': r,
                    } as CSSProperties
                  }
                >
                  <div
                    className={`jelly symbol-${cell.symbol} ${active.has(cell.id) ? 'is-matched' : ''} ${created.has(cell.id) ? 'is-created' : ''} ${triggered.has(cell.id) ? 'is-triggered' : ''}`}
                  >
                    <img src={symbol.asset} alt="" draggable="false" width="256" height="256" />
                    <span
                      className={`symbol-mark ${symbol.category === 'special' ? 'special-mark' : ''}`}
                    >
                      {symbol.mark}
                    </span>
                    {active.has(cell.id) && event.phase === 'popping' && (
                      <span className="pop-particles" />
                    )}
                  </div>
                </div>
              );
            }),
          )}
        </div>
        {event.phase === 'popping' && (
          <div
            key={`${event.cascade}-${event.score}`}
            className={`combo-burst level-${Math.min(event.cascade, 6)}`}
            aria-hidden="true"
          >
            <span>{comboLabel(event.cascade)}</span>
            <strong>+{event.scoreDelta.toLocaleString()}</strong>
            <small>COMBO ×{comboMultiplier(event.cascade)}</small>
          </div>
        )}
        {event.type === 'SPECIAL_TRIGGER' && (
          <div className="fire-flash" aria-hidden="true">
            {event.triggered.length > 1 ? 'FIRE CHAIN REACTION' : 'FIRE REACTION'}
          </div>
        )}
      </div>
      <div className="chamber-bottom">
        <span>CONNECT · POP · CASCADE</span>
        <span>
          <i /> JELLY CULTURE 012
        </span>
      </div>
    </div>
  );
}
