import pink from '../../assets/jellies/pink.webp';
import yellow from '../../assets/jellies/yellow.webp';
import aqua from '../../assets/jellies/aqua.webp';
import green from '../../assets/jellies/green.webp';
import purple from '../../assets/jellies/purple.webp';
import fire from '../../assets/jellies/fire.webp';
import bonus from '../../assets/jellies/bonus.webp';
import { GAME_CONFIG as C } from '../config';
import type { SpecialType, SymbolId } from '../types';
export interface JellySymbol {
  id: SymbolId;
  displayName: string;
  asset: string;
  category: 'normal' | 'special';
  enabled: boolean;
  spawnWeight: number;
  specialType: SpecialType;
  description: string;
  mark: string;
}
const define = (
  id: SymbolId,
  displayName: string,
  asset: string,
  description: string,
  mark: string,
  specialType: SpecialType = null,
): JellySymbol => ({
  id,
  displayName,
  asset,
  category: specialType ? 'special' : 'normal',
  enabled: true,
  spawnWeight: C.spawnWeights[id],
  specialType,
  description,
  mark,
});
export const JELLY_SYMBOLS: Record<SymbolId, JellySymbol> = {
  pink: define('pink', 'Palette · 畫家 Jelly', pink, '帶著調色盤，把每次相遇染成粉紅。', 'P'),
  yellow: define(
    'yellow',
    'Sunny · 黃色皇冠 Jelly',
    yellow,
    '戴著小皇冠的黃色夥伴，與同色 Jelly 相連就能消除。',
    'Y',
  ),
  green: define('green', 'Scout · 觀察家 Jelly', green, '拿起放大鏡，發現綠色的連鎖。', 'G'),
  purple: define('purple', 'Sigh · 嘆氣 Jelly', purple, '紫色的小煩惱，碰在一起就消散。', 'V'),
  aqua: define('aqua', 'Dew · 水光 Jelly', aqua, '圓圓淚眼與水瓶，是水藍色的溫柔。', 'A'),
  fire: define(
    'fire',
    'FIRE · 火焰 Jelly',
    fire,
    '下一次掃描引爆周圍 3×3，還能觸發其他 FIRE。',
    'F',
    'fire',
  ),
  bonus: define(
    'bonus',
    'BONUS · 月亮 Jelly',
    bonus,
    '累積遇見 3 隻，解鎖 BONUS MODE 預覽。',
    '★',
    'bonus',
  ),
};
