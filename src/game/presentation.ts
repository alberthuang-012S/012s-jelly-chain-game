import type { GameEvent } from './types';

export interface Presentation {
  event: GameEvent;
  duration: number;
  factor: number;
  reduced: boolean;
  done: () => void;
}

// The renderer owns completion. Preferences are captured once per stage.
export class PlaybackGate {
  private release?: () => void;
  show(
    event: GameEvent,
    duration: number,
    factor: number,
    reduced: boolean,
    render: (frame: Presentation) => void,
  ): Promise<void> {
    return new Promise((resolve) => {
      const done = () => {
        if (this.release !== done) return;
        this.release = undefined;
        resolve();
      };
      this.release = done;
      render({ event, duration, factor, reduced, done });
    });
  }
  cancel() {
    this.release?.();
  }
}
