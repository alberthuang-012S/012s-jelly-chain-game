import { GAME_CONFIG as C } from '../config';
export function baseScore(size: number) {
  if (size < C.minClusterSize) return 0;
  return (
    C.baseScores[size] ??
    C.largeClusterBase + (size - C.largeClusterThreshold) * C.largeClusterIncrement
  );
}
export const comboMultiplier = (cascade: number) =>
  cascade < 1 ? 0 : C.comboMultipliers[Math.min(cascade, C.comboMultipliers.length) - 1];
export const comboLabel = (cascade: number) =>
  C.comboLabels[Math.max(0, Math.min(cascade, C.comboLabels.length) - 1)];
export const clusterScore = (size: number, cascade: number) =>
  Math.round(baseScore(size) * comboMultiplier(cascade));
export const toMockPoints = (score: number) => Math.floor(score / C.mockPointDivisor);
