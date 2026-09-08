import { useEffect, useRef, useState } from 'react';
import { AudioManager, type SoundEvent } from '../audio/AudioManager';
import { GAME_CONFIG as C } from '../game/config';
import { previewBoard, type Scenario } from '../game/debug';
import { LocalGameService } from '../game/services';
import type { GameEvent, RoundSummary } from '../game/types';
import { PlaybackGate, type Presentation } from '../game/presentation';
import { preloadJellies } from '../game/preload';
import { PlayerStore, browserStorage } from '../storage';
const initialEvent = (): GameEvent => ({
  type: 'ROUND_START',
  phase: 'idle',
  board: previewBoard(),
  cascade: 0,
  score: 0,
  scoreDelta: 0,
  highlighted: [],
  triggered: [],
  movements: [],
  created: [],
  bonusCollected: 0,
});
const soundFor: Partial<Record<GameEvent['type'], SoundEvent>> = {
  ROUND_START: 'start',
  SPAWN: 'drop',
  MATCH_FOUND: 'match',
  SPECIAL_TRIGGER: 'fire',
  POP: 'pop',
  GRAVITY: 'drop',
  ROUND_COMPLETE: 'result',
};
export function useGame() {
  const [service] = useState(() => new LocalGameService(new PlayerStore(browserStorage())));
  const [audio] = useState(() => new AudioManager());
  const [player, setPlayer] = useState(() => service.readPlayer());
  const [event, setEvent] = useState(initialEvent);
  const [frame, setFrame] = useState<Presentation | null>(null);
  const [starting, setStarting] = useState(false);
  const [gate] = useState(() => new PlaybackGate());
  const [result, setResult] = useState<RoundSummary | null>(null);
  const [error, setError] = useState('');
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const lock = useRef(false),
    skipped = useRef(false),
    mounted = useRef(true);
  const preferences = useRef(player);
  preferences.current = player;
  audio.enabled = player.soundEnabled;
  useEffect(() => {
    mounted.current = true;
    void preloadJellies().catch(() => undefined);
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => {
      mounted.current = false;
      gate.cancel();
      service.finishPlayback();
      audio.dispose();
      query.removeEventListener('change', update);
    };
  }, [audio, service, gate]);
  const start = async (scenario?: Scenario) => {
    if (lock.current || player.plays <= 0) return;
    lock.current = true;
    setStarting(true);
    skipped.current = false;
    setResult(null);
    setError('');
    void audio.unlock();
    try {
      await preloadJellies();
      if (!mounted.current) return;
      const receipt = await service.startRound({ scenario });
      if (!mounted.current) return;
      setPlayer((p) => ({ ...p, plays: receipt.player.plays }));
      let bonusCount = 0;
      for (const next of receipt.result.events) {
        if (!mounted.current) return;
        if (skipped.current) break;
        const sound = soundFor[next.type];
        if (sound) audio.play(sound, next.cascade);
        if (next.type === 'POP' && next.cascade >= 2) audio.play('combo', next.cascade);
        if (next.bonusCollected > bonusCount) {
          audio.play('bonus');
          bonusCount = next.bonusCollected;
        }
        const factor =
          (preferences.current.fastMode ? C.animation.fastFactor : 1) *
          (reducedMotion ? C.animation.reducedFactor : 1);
        const delay =
          next.type === 'SPECIAL_CREATED'
            ? C.animation.matching
            : C.animation[next.phase as keyof typeof C.animation];
        await gate.show(
          next,
          (typeof delay === 'number' ? delay : 100) * factor,
          factor,
          reducedMotion,
          (presentation) => {
            setEvent(next);
            setFrame(presentation);
          },
        );
      }
      if (mounted.current) {
        setFrame(null);
        setEvent(receipt.result.events.at(-1)!);
        setResult(receipt.result.summary);
        setPlayer(service.readPlayer());
        if (skipped.current) audio.play('result');
      }
    } catch (cause) {
      if (mounted.current) {
        setError(cause instanceof Error ? cause.message : '實驗暫時無法啟動，請再試一次。');
        setEvent(initialEvent());
      }
    } finally {
      lock.current = false;
      if (mounted.current) setStarting(false);
      service.finishPlayback();
    }
  };
  const busy = starting || (event.phase !== 'idle' && event.phase !== 'complete');
  return {
    event,
    frame,
    result,
    player,
    busy,
    error,
    reducedMotion,
    persistent: service.store.persistent,
    start,
    dismissResult: () => setResult(null),
    skip: () => {
      skipped.current = true;
      gate.cancel();
    },
    toggleSound: () => {
      const enabled = !player.soundEnabled;
      audio.enabled = enabled;
      if (enabled) {
        void audio.unlock().then(() => audio.play('start'));
      }
      service.updateSettings({ soundEnabled: enabled });
      setPlayer((p) => ({ ...p, soundEnabled: enabled }));
    },
    toggleFast: () => {
      service.updateSettings({ fastMode: !player.fastMode });
      setPlayer((p) => ({ ...p, fastMode: !p.fastMode }));
    },
    debugAdd: (kind: 'plays' | 'mockPoints', amount: number) =>
      setPlayer(service.debugUpdate({ [kind]: service.readPlayer()[kind] + amount })),
    debugReset: () => {
      setPlayer(service.debugReset());
      setEvent(initialEvent());
      setResult(null);
    },
  };
}
