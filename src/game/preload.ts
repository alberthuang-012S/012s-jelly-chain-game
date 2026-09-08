import { JELLY_SYMBOLS } from './symbols';
let pending: Promise<void> | undefined;
export function preloadJellies(): Promise<void> {
  return (pending ??= Promise.all(
    Object.values(JELLY_SYMBOLS).map(async ({ asset }) => {
      const image = new Image();
      image.src = asset;
      await image.decode();
    }),
  )
    .then(() => undefined)
    .catch((error) => {
      pending = undefined;
      throw error;
    }));
}
