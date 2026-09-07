import { useEffect, useRef, type CSSProperties } from 'react';
import { GAME_CONFIG as C } from '../game/config';
import { comboLabel, comboMultiplier } from '../game/scoring';
import { JELLY_SYMBOLS } from '../game/symbols';
import type { GameEvent } from '../game/types';
export function Board({
  event,
  fast,
  reducedMotion,
}: {
  event: GameEvent;
  fast: boolean;
  reducedMotion: boolean;
}) {
  const previous = useRef(event),
    container = useRef<HTMLDivElement>(null);
  const active = new Set(event.highlighted),
    created = new Set(event.created),
    triggered = new Set(event.triggered);
  const factor =
    (fast ? C.animation.fastFactor : 1) * (reducedMotion ? C.animation.reducedFactor : 1);
  useEffect(() => {
    if (previous.current === event) return;
    previous.current = event;
    const root = container.current;
    if (!root || reducedMotion) return;
    const animations: Animation[] = [];
    for (const element of root.querySelectorAll<HTMLElement>('.jelly-position')) {
      const cellId = element.dataset.cellId;
      const movement = event.movements.find((m) => m.id === cellId);
      if (movement) {
        const distance = (movement.from.row - movement.to.row) * element.offsetHeight;
        animations.push(
          element.animate(
            [
              { transform: `translateY(${distance}px)` },
              { transform: 'translateY(3px)', offset: 0.85 },
              { transform: 'translateY(0)' },
            ],
            {
              duration: C.animation[event.phase === 'falling' ? 'falling' : 'refilling'] * factor,
              easing: 'cubic-bezier(.2,.7,.3,1)',
            },
          ),
        );
      }
    }
    return () => animations.forEach((a) => a.cancel());
  }, [event, factor, reducedMotion]);
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
        <div ref={container} className={`jellies phase-${event.phase}`} aria-hidden="true">
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
            FIRE REACTION
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
